import { detectPatterns } from "./technical";

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Safe fetch with timeout — prevents infinite loading
const safeFetch = (url, opts = {}, timeoutMs = 8000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
};

// Parse Yahoo response — with safety checks for short/empty data
const parseYahoo = json => {
  const r = json?.chart?.result?.[0];
  if (!r) return null;
  const raw = r.indicators?.quote?.[0]?.close;
  if (!Array.isArray(raw)) return null;
  const closes = raw.filter(v => v != null && isFinite(v));
  if (closes.length < 2) return null;
  const meta = r.meta || {};
  const n = closes.length;
  const pct = (a, b) => b !== 0 ? parseFloat(((a - b) / b * 100).toFixed(2)) : 0;
  return {
    price:    closes[n - 1].toFixed(2),
    change1d: pct(closes[n - 1], closes[n - 2]),
    change1w: pct(closes[n - 1], closes[Math.max(0, n - 6)]),
    change1m: pct(closes[n - 1], closes[Math.max(0, n - 22)]),
    volume:   meta.regularMarketVolume
      ? (meta.regularMarketVolume / 1e6).toFixed(1) + "M"
      : "N/A",
    closes,
  };
};

// Parse Finnhub response — with safety checks
const parseFinnhub = json => {
  if (json?.s !== "ok" || !Array.isArray(json.c) || json.c.length < 2) return null;
  const closes = json.c.filter(v => v != null && isFinite(v));
  if (closes.length < 2) return null;
  const n = closes.length;
  const pct = (a, b) => b !== 0 ? parseFloat(((a - b) / b * 100).toFixed(2)) : 0;
  return {
    price:    closes[n - 1].toFixed(2),
    change1d: pct(closes[n - 1], closes[n - 2]),
    change1w: pct(closes[n - 1], closes[Math.max(0, n - 6)]),
    change1m: pct(closes[n - 1], closes[Math.max(0, n - 22)]),
    volume:   "N/A",
    closes,
  };
};

// Extract JSON safely from AI text response
const extractJSON = text => {
  if (!text || typeof text !== "string") return null;
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
};

// ── TECHNICAL DATA ────────────────────────────────────────────────────────────
// Tries Yahoo Finance → Finnhub → Claude AI (web search fallback)
export const fetchStockData = async (symbol, interval, range, apiKeys = {}) => {

  // 1. Yahoo Finance
  try {
    const resp = await safeFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    );
    if (resp.ok) {
      const json = await resp.json();
      const parsed = parseYahoo(json);
      if (parsed) return { ...parsed, source: "yahoo" };
    }
  } catch (_) { /* move to next source */ }

  // 2. Finnhub
  if (apiKeys.finnhub) {
    try {
      const res = { "1h": "60", "1d": "D" }[interval] || "D";
      const to = Math.floor(Date.now() / 1000);
      const days = range === "1mo" ? 30 : range === "3mo" ? 90 : range === "6mo" ? 180 : 365;
      const from = to - days * 86400;
      const resp = await safeFetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${res}&from=${from}&to=${to}&token=${apiKeys.finnhub}`
      );
      if (resp.ok) {
        const json = await resp.json();
        const parsed = parseFinnhub(json);
        if (parsed) return { ...parsed, source: "finnhub" };
      }
    } catch (_) { /* move to next source */ }
  }

  // 3. Claude AI with web search (wrapped in try/catch + timeout)
  try {
    const resp = await safeFetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Search for current real stock market data for ticker "${symbol}". Find its current price, today's % change, 7-day % change, 30-day % change, and daily volume. Then return ONLY a raw JSON object (no markdown, no backticks, no explanation): {"price":<current price as number>,"change1d":<today % change>,"change1w":<7-day % change>,"change1m":<30-day % change>,"volume":"<e.g. 48.2M>","closes":[<array of 60 plausible recent daily closing prices, oldest first, ending at current price>]}`,
          }],
        }),
      },
      20000 // AI calls can take longer
    );

    if (!resp.ok) throw new Error(`AI API returned ${resp.status}`);

    const aiData = await resp.json();
    const rawText = (aiData.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");
    const p = extractJSON(rawText);
    if (!p || typeof p.price === "undefined") throw new Error("AI returned invalid data");

    const closes = Array.isArray(p.closes)
      ? p.closes.filter(v => typeof v === "number" && isFinite(v))
      : [];
    if (closes.length < 5) throw new Error("Not enough price data from AI");

    return {
      price:    parseFloat(p.price).toFixed(2),
      change1d: parseFloat(p.change1d) || 0,
      change1w: parseFloat(p.change1w) || 0,
      change1m: parseFloat(p.change1m) || 0,
      volume:   p.volume || "N/A",
      closes,
      source: "ai",
    };
  } catch (_) { /* all sources failed */ }

  // ALL SOURCES FAILED — throw friendly error instead of hanging
  throw new Error("Unable to load data. Check your connection or API keys and try again.");
};

// ── FUNDAMENTAL DATA ──────────────────────────────────────────────────────────
// Fetches news, metrics, analyst rating via Claude AI web search
export const fetchFundamental = async (symbol, lang = "he") => {
  const L = lang === "he" ? "Hebrew" : "English";
  const ds = lang === "he" ? "לפני יומיים" : "2 days ago";

  try {
    const resp = await safeFetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content:
              `Search for latest financial data for stock "${symbol}". Return ONLY valid JSON no markdown. All text in ${L}. Sort news newest first:\n` +
              `{"companyName":"<n>","sector":"<sector>","recommendation":"Buy|Hold|Sell","recommendationScore":<0-100>,` +
              `"summary":"<2-3 sentence assessment in ${L}>","eps":"<or null>","revenue":"<quarterly or null>",` +
              `"peRatio":"<or null>","marketCap":"<or null>","divYield":"<or null>","week52Range":"<or null>",` +
              `"analystTarget":"<or null>","news":[` +
              `{"title":"<${L}>","summary":"<1-2 sentences ${L}>","sentiment":"positive|negative|neutral","date":"<e.g. ${ds}>","daysAgo":<int 0=today>},` +
              `{"title":"<${L}>","summary":"<${L}>","sentiment":"positive|negative|neutral","date":"<>","daysAgo":<int>},` +
              `{"title":"<${L}>","summary":"<${L}>","sentiment":"positive|negative|neutral","date":"<>","daysAgo":<int>}]}`,
          }],
        }),
      },
      20000
    );

    if (!resp.ok) throw new Error(`API returned ${resp.status}`);

    const data = await resp.json();
    const text = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const parsed = extractJSON(text);
    if (!parsed) throw new Error("parse error");

    // Sort news newest first
    if (Array.isArray(parsed.news) && parsed.news.length) {
      parsed.news.sort((a, b) => (a.daysAgo ?? 99) - (b.daysAgo ?? 99));
    }

    // Ensure expected fields exist so components don't crash
    return {
      companyName: parsed.companyName || symbol,
      sector: parsed.sector || null,
      recommendation: parsed.recommendation || "Hold",
      recommendationScore: parsed.recommendationScore ?? 50,
      summary: parsed.summary || null,
      eps: parsed.eps || null,
      revenue: parsed.revenue || null,
      peRatio: parsed.peRatio || null,
      marketCap: parsed.marketCap || null,
      divYield: parsed.divYield || null,
      week52Range: parsed.week52Range || null,
      analystTarget: parsed.analystTarget || null,
      news: Array.isArray(parsed.news) ? parsed.news : [],
    };
  } catch (e) {
    throw new Error("Unable to load fundamental data. Try again later.");
  }
};

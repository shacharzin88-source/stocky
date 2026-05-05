// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DEMO_WARNING = "Live data unavailable in local demo mode";

const DEMO_COMPANIES = {
  AAPL: { companyName: "Apple Inc.",      sector: "Technology"     },
  TSLA: { companyName: "Tesla Inc.",      sector: "Automotive"     },
  NVDA: { companyName: "NVIDIA Corp.",    sector: "Semiconductors" },
  MSFT: { companyName: "Microsoft Corp.", sector: "Technology"     },
  AMZN: { companyName: "Amazon.com Inc.", sector: "E-Commerce"     },
  GOOG: { companyName: "Alphabet Inc.",   sector: "Technology"     },
};

const hashSym = sym => {
  let h = 5381;
  for (let i = 0; i < sym.length; i++) h = ((h << 5) + h) + sym.charCodeAt(i);
  return Math.abs(h);
};

const mockStockData = symbol => {
  const h   = hashSym(symbol);
  const rng = (min, max, seed = 1) =>
    min + ((h * seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  const base  = rng(50, 450, 1);
  const trend = rng(-0.3, 0.5, 2);
  const vol   = rng(0.008, 0.025, 3);
  const closes = Array.from({ length: 260 }, (_, i) => {
    const noise = rng(-1, 1, i + 10) * vol * base;
    return parseFloat((base * (1 + trend * i / 260) + noise).toFixed(2));
  });
  const n   = closes.length;
  const pct = (a, b) => parseFloat(((a - b) / b * 100).toFixed(2));
  return {
    price:    closes[n - 1].toFixed(2),
    change1d: pct(closes[n - 1], closes[n - 2]),
    change1w: pct(closes[n - 1], closes[n - 6]),
    change1m: pct(closes[n - 1], closes[n - 22]),
    volume:   rng(10, 90, 4).toFixed(1) + "M",
    closes,
    source:   "demo",
    warning:  DEMO_WARNING,
  };
};

const mockFundamental = (symbol, lang) => {
  const co   = DEMO_COMPANIES[symbol] || { companyName: `${symbol} Inc.`, sector: "Technology" };
  const isHe = lang === "he";
  return {
    ...co,
    recommendation:      "Hold",
    recommendationScore: 55,
    summary: isHe
      ? `נתונים בזמן אמת אינם זמינים במצב דמו מקומי. זוהי תצוגה לדוגמה עבור ${co.companyName}.`
      : `Live data unavailable in local demo mode. This is a sample view for ${co.companyName}.`,
    eps: null, revenue: null, peRatio: null,
    marketCap: null, divYield: null, week52Range: null, analystTarget: null,
    news: [{
      title:     isHe ? "נתוני חדשות אינם זמינים במצב דמו" : "News unavailable in demo mode",
      summary:   isHe
        ? "הפעל proxy או פרוס לשרת כדי לקבל חדשות אמיתיות."
        : "Deploy to a server or add a proxy to receive live news.",
      sentiment: "neutral",
      date:      isHe ? "עכשיו" : "now",
      daysAgo:   0,
    }],
    source:  "demo",
    warning: DEMO_WARNING,
  };
};

const isSafeError = err =>
  err instanceof TypeError ||
  /cors|network|failed to fetch|load failed/i.test(err?.message || "");

const safeJson = async resp => {
  try { return await resp.json(); } catch { return null; }
};

const parseYahoo = json => {
  const r      = json.chart.result[0];
  const closes = r.indicators.quote[0].close.filter(v => v != null);
  const meta   = r.meta;
  const n      = closes.length;
  return {
    price:    closes[n - 1].toFixed(2),
    change1d: parseFloat(((closes[n-1] - closes[n-2])              / closes[n-2]              * 100).toFixed(2)),
    change1w: parseFloat(((closes[n-1] - closes[Math.max(0,n-6)])  / closes[Math.max(0,n-6)]  * 100).toFixed(2)),
    change1m: parseFloat(((closes[n-1] - closes[Math.max(0,n-22)]) / closes[Math.max(0,n-22)] * 100).toFixed(2)),
    volume:   meta.regularMarketVolume ? (meta.regularMarketVolume / 1e6).toFixed(1) + "M" : "N/A",
    closes,
  };
};

const parseFinnhub = json => {
  const closes = json.c;
  const n      = closes.length;
  return {
    price:    closes[n-1].toFixed(2),
    change1d: parseFloat(((closes[n-1] - closes[n-2])              / closes[n-2]              * 100).toFixed(2)),
    change1w: parseFloat(((closes[n-1] - closes[Math.max(0,n-6)])  / closes[Math.max(0,n-6)]  * 100).toFixed(2)),
    change1m: parseFloat(((closes[n-1] - closes[Math.max(0,n-22)]) / closes[Math.max(0,n-22)] * 100).toFixed(2)),
    volume:   "N/A",
    closes,
  };
};

// ── fetchStockData — Yahoo → Finnhub → Claude AI → demo mock ──────────────────
export const fetchStockData = async (symbol, interval, range, apiKeys = {}) => {

  // 1. Yahoo Finance
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const resp  = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (resp.ok) {
      const json = await safeJson(resp);
      if (json?.chart?.result?.[0]) return { ...parseYahoo(json), source: "yahoo" };
    }
  } catch (err) {
    if (!isSafeError(err)) throw err;
  }

  // 2. Finnhub
  if (apiKeys.finnhub) {
    try {
      const res  = { "1h": "60", "1d": "D" }[interval] || "D";
      const to   = Math.floor(Date.now() / 1000);
      const days = range === "1mo" ? 30 : range === "3mo" ? 90 : range === "6mo" ? 180 : 365;
      const resp = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${res}&from=${to - days * 86400}&to=${to}&token=${apiKeys.finnhub}`
      );
      if (resp.ok) {
        const json = await safeJson(resp);
        if (json?.s === "ok" && json.c?.length)
          return { ...parseFinnhub(json), source: "finnhub" };
      }
    } catch (err) {
      if (!isSafeError(err)) throw err;
    }
  }

  // 3. Claude AI with web search
  try {
    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 3000,
        tools:      [{ type: "web_search_20250305", name: "web_search" }],
        messages:   [{
          role:    "user",
          content:
            `Search for current real stock market data for ticker "${symbol}". ` +
            `Return ONLY a raw JSON object (no markdown, no backticks): ` +
            `{"price":<number>,"change1d":<number>,"change1w":<number>,"change1m":<number>,` +
            `"volume":"<e.g. 48.2M>","closes":[<60 daily closes oldest-first ending at current price>]}`,
        }],
      }),
    });
    if (aiResp.ok) {
      const data    = await aiResp.json();
      const rawText = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
      if (s !== -1 && e !== -1) {
        const p      = JSON.parse(cleaned.slice(s, e + 1));
        const closes = Array.isArray(p.closes)
          ? p.closes.filter(v => typeof v === "number" && isFinite(v))
          : [];
        if (closes.length >= 5) {
          return {
            price:    parseFloat(p.price).toFixed(2),
            change1d: parseFloat(p.change1d) || 0,
            change1w: parseFloat(p.change1w) || 0,
            change1m: parseFloat(p.change1m) || 0,
            volume:   p.volume || "N/A",
            closes,
            source:   "ai",
          };
        }
      }
    }
  } catch (err) {
    if (!isSafeError(err)) throw err;
  }

  // 4. Demo fallback — never throws
  return mockStockData(symbol);
};

// ── fetchFundamental — /api/perplexity (serverless proxy) → demo mock ─────────
export const fetchFundamental = async (symbol, lang = "he") => {
  try {
    const resp = await fetch(`/api/perplexity?symbol=${encodeURIComponent(symbol)}&lang=${lang}`);
    if (resp.ok) {
      const data = await safeJson(resp);
      // If serverless returned a valid object with companyName, trust it
      if (data?.companyName) return data;
    }
  } catch (err) {
    if (!isSafeError(err)) throw err;
  }

  // Fallback — always returns a valid structure
  return mockFundamental(symbol, lang);
};

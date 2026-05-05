// In-memory cache — stores results for 6 hours per symbol+lang combination.
// Vercel serverless functions share memory within the same instance,
// so this meaningfully reduces API calls during active traffic periods.
const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const getCached = key => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.data;
};

const setCached = (key, data) => {
  // Keep cache size bounded — evict oldest entry if over 200 items
  if (cache.size >= 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { data, ts: Date.now() });
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { symbol = "AAPL", lang = "he" } = req.query;
  const isHe = lang === "he";
  const L     = isHe ? "Hebrew" : "English";
  const ds    = isHe ? "לפני יומיים" : "2 days ago";

  const FALLBACK = {
    companyName:         `${symbol} Inc.`,
    sector:              null,
    recommendation:      "Hold",
    recommendationScore: 50,
    summary: isHe
      ? `לא ניתן לטעון נתונים עבור ${symbol} כרגע. נסה שוב מאוחר יותר.`
      : `Could not load data for ${symbol}. Please try again later.`,
    eps: null, revenue: null, peRatio: null,
    marketCap: null, divYield: null, week52Range: null, analystTarget: null,
    news: [{
      title:     isHe ? "הנתונים אינם זמינים כרגע" : "Data temporarily unavailable",
      summary:   isHe ? "נסה לרענן את הדף." : "Please refresh the page.",
      sentiment: "neutral",
      date:      isHe ? "עכשיו" : "now",
      daysAgo:   0,
    }],
    source: "fallback",
  };

  // ── Cache check ────────────────────────────────────────────────────────────
  const cacheKey = `${symbol.toUpperCase()}:${lang}`;
  const cached = getCached(cacheKey);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cached);
  }

  // ── Perplexity API call ────────────────────────────────────────────────────
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.error("PERPLEXITY_API_KEY is not set");
      return res.status(200).json(FALLBACK);
    }

    const prompt =
      `Find the latest financial data and news for stock ticker "${symbol}". ` +
      `Return ONLY a valid JSON object, no markdown, no explanation. ` +
      `All text fields must be in ${L}. Sort news array newest first. Use this exact structure:\n` +
      `{"companyName":"<full name>","sector":"<sector>","recommendation":"Buy|Hold|Sell",` +
      `"recommendationScore":<0-100>,"summary":"<2-3 sentences in ${L}>",` +
      `"eps":"<or null>","revenue":"<or null>","peRatio":"<or null>",` +
      `"marketCap":"<e.g. $3.1T or null>","divYield":"<e.g. 0.52% or null>",` +
      `"week52Range":"<e.g. $164-$210 or null>","analystTarget":"<or null>",` +
      `"news":[` +
      `{"title":"<${L}>","summary":"<1-2 sentences ${L}>","sentiment":"positive|negative|neutral","date":"<e.g. ${ds}>","daysAgo":<int 0=today>},` +
      `{"title":"<${L}>","summary":"<${L}>","sentiment":"positive|negative|neutral","date":"<>","daysAgo":<int>},` +
      `{"title":"<${L}>","summary":"<${L}>","sentiment":"positive|negative|neutral","date":"<>","daysAgo":<int>}]}`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:            "sonar",
        messages: [
          { role: "system", content: "You are a financial data assistant. Return only valid JSON with no markdown fences or extra text." },
          { role: "user",   content: prompt },
        ],
        max_tokens:       1500,
        temperature:      0.1,
        return_citations: true,
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API error:", response.status);
      return res.status(200).json(FALLBACK);
    }

    const data    = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");

    if (s === -1 || e === -1) {
      console.error("No JSON in Perplexity response");
      return res.status(200).json(FALLBACK);
    }

    const parsed = JSON.parse(cleaned.slice(s, e + 1));
    if (Array.isArray(parsed.news))
      parsed.news.sort((a, b) => (a.daysAgo ?? 99) - (b.daysAgo ?? 99));

    const result = {
      companyName:         parsed.companyName         ?? FALLBACK.companyName,
      sector:              parsed.sector              ?? null,
      recommendation:      parsed.recommendation      ?? "Hold",
      recommendationScore: parsed.recommendationScore ?? 50,
      summary:             parsed.summary             ?? FALLBACK.summary,
      eps:                 parsed.eps                 ?? null,
      revenue:             parsed.revenue             ?? null,
      peRatio:             parsed.peRatio             ?? null,
      marketCap:           parsed.marketCap           ?? null,
      divYield:            parsed.divYield            ?? null,
      week52Range:         parsed.week52Range         ?? null,
      analystTarget:       parsed.analystTarget       ?? null,
      news: Array.isArray(parsed.news) && parsed.news.length > 0
        ? parsed.news : FALLBACK.news,
      source:    "perplexity",
      cachedAt:  new Date().toISOString(),
    };

    // Store in cache before returning
    setCached(cacheKey, result);
    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(result);

  } catch (err) {
    console.error("perplexity handler error:", err.message);
    return res.status(200).json(FALLBACK);
  }
}

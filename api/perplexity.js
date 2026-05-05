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

    return res.status(200).json({
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
      source: "perplexity",
    });

  } catch (err) {
    console.error("perplexity handler error:", err.message);
    return res.status(200).json(FALLBACK);
  }
}

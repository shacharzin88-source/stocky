// Server-side proxy for Yahoo Finance — bypasses CORS
// Called by the frontend as /api/stock?symbol=AAPL&interval=1d&range=1y
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { symbol = "AAPL", interval = "1d", range = "1y" } = req.query;

  const FALLBACK = symbol => {
    const h = [...symbol].reduce((h, c) => ((h << 5) + h) + c.charCodeAt(0), 5381);
    const rng = (min, max, seed = 1) =>
      min + ((Math.abs(h) * seed * 9301 + 49297) % 233280) / 233280 * (max - min);
    const base = rng(50, 450, 1), trend = rng(-0.3, 0.5, 2), vol = rng(0.008, 0.025, 3);
    const closes = Array.from({ length: 260 }, (_, i) => {
      const noise = rng(-1, 1, i + 10) * vol * base;
      return parseFloat((base * (1 + trend * i / 260) + noise).toFixed(2));
    });
    const n = closes.length;
    const pct = (a, b) => parseFloat(((a - b) / b * 100).toFixed(2));
    return {
      price:    closes[n-1].toFixed(2),
      change1d: pct(closes[n-1], closes[n-2]),
      change1w: pct(closes[n-1], closes[n-6]),
      change1m: pct(closes[n-1], closes[n-22]),
      volume:   rng(10, 90, 4).toFixed(1) + "M",
      closes,
      source:   "demo",
    };
  };

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!resp.ok) {
      console.error("Yahoo Finance error:", resp.status);
      return res.status(200).json(FALLBACK(symbol));
    }

    const json = await resp.json();
    const result = json?.chart?.result?.[0];
    if (!result) return res.status(200).json(FALLBACK(symbol));

    const closes = result.indicators.quote[0].close.filter(v => v != null);
    const meta   = result.meta;
    const n      = closes.length;

    if (n < 2) return res.status(200).json(FALLBACK(symbol));

    return res.status(200).json({
      price:    closes[n-1].toFixed(2),
      change1d: parseFloat(((closes[n-1] - closes[n-2])              / closes[n-2]              * 100).toFixed(2)),
      change1w: parseFloat(((closes[n-1] - closes[Math.max(0,n-6)])  / closes[Math.max(0,n-6)]  * 100).toFixed(2)),
      change1m: parseFloat(((closes[n-1] - closes[Math.max(0,n-22)]) / closes[Math.max(0,n-22)] * 100).toFixed(2)),
      volume:   meta.regularMarketVolume ? (meta.regularMarketVolume / 1e6).toFixed(1) + "M" : "N/A",
      closes,
      source: "yahoo",
    });

  } catch (err) {
    console.error("stock proxy error:", err.message);
    return res.status(200).json(FALLBACK(symbol));
  }
}

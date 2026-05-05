// ── TECHNICAL ANALYSIS UTILITIES ─────────────────────────────────────────────
// Disclaimer: This is an educational tool, not investment advice.

export const calcRSI = (c, p = 14) => {
  if (c.length < p + 1) return 50;
  let g = 0, l = 0;
  for (let i = c.length - p; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    if (d > 0) g += d; else l -= d;
  }
  return parseFloat((100 - 100 / (1 + (g / p) / ((l / p) || 0.001))).toFixed(1));
};

export const calcMA = (c, p) =>
  c.map((_, i) =>
    i < p - 1 ? null : c.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0) / p
  );

// ── HELPER: find local peaks and troughs ─────────────────────────────────────
const findPeaks = (arr, radius = 2) => {
  const peaks = [];
  for (let i = radius; i < arr.length - radius; i++) {
    let isPeak = true;
    for (let r = 1; r <= radius; r++) {
      if (arr[i] <= arr[i - r] || arr[i] <= arr[i + r]) { isPeak = false; break; }
    }
    if (isPeak) peaks.push({ i, v: arr[i] });
  }
  return peaks;
};

const findTroughs = (arr, radius = 2) => {
  const troughs = [];
  for (let i = radius; i < arr.length - radius; i++) {
    let isTrough = true;
    for (let r = 1; r <= radius; r++) {
      if (arr[i] >= arr[i - r] || arr[i] >= arr[i + r]) { isTrough = false; break; }
    }
    if (isTrough) troughs.push({ i, v: arr[i] });
  }
  return troughs;
};

const confLabel = n => n >= 75 ? "high" : n >= 55 ? "medium" : "low";

const inferTimeframe = n => n > 180 ? "monthly" : n > 40 ? "weekly" : "daily";

// ── PATTERN DETECTORS ────────────────────────────────────────────────────────

const detectBreakout = (win) => {
  const n = win.length;
  if (n < 10) return null;
  const lookback = win.slice(0, n - 2);
  const resistance = Math.max(...lookback);
  const last = win[n - 1];
  const prev = win[n - 2];
  const breakPct = (last - resistance) / resistance;
  if (last > resistance * 1.01 && prev > resistance * 0.995) {
    const conf = breakPct > 0.03 ? 82 : breakPct > 0.015 ? 72 : 62;
    return {
      name: "Breakout",
      direction: "bullish",
      timeframe: inferTimeframe(n),
      confidence: conf,
      confidenceLevel: confLabel(conf),
      explanation: "The price broke above its recent high — this often signals the start of a new upward move.",
      confirmationLevel: breakPct > 0.02 ? "Confirmed — strong break" : "Early — needs follow-through",
      possibleEntry: `Above $${resistance.toFixed(2)} (the broken resistance)`,
      stopLoss: `Below $${(resistance * 0.98).toFixed(2)}`,
      reason: `Price crossed ${(breakPct * 100).toFixed(1)}% above the period high of $${resistance.toFixed(2)}.`,
      invalidation: `A close back below $${resistance.toFixed(2)} would invalidate this breakout.`,
      chartData: { type: "breakout", closes: win, resistance, breakPct: (breakPct * 100).toFixed(1) },
    };
  }
  return null;
};

const detectBreakdown = (win) => {
  const n = win.length;
  if (n < 10) return null;
  const lookback = win.slice(0, n - 2);
  const support = Math.min(...lookback);
  const last = win[n - 1];
  const breakPct = (support - last) / support;
  if (last < support * 0.99 && win[n - 2] < support * 1.005) {
    const conf = breakPct > 0.03 ? 80 : breakPct > 0.015 ? 70 : 60;
    return {
      name: "Breakdown",
      direction: "bearish",
      timeframe: inferTimeframe(n),
      confidence: conf,
      confidenceLevel: confLabel(conf),
      explanation: "The price fell below its recent low — this could mean further decline ahead.",
      confirmationLevel: breakPct > 0.02 ? "Confirmed — clear break" : "Early — watch for bounce",
      possibleEntry: `Short below $${support.toFixed(2)}`,
      stopLoss: `Above $${(support * 1.02).toFixed(2)}`,
      reason: `Price dropped ${(breakPct * 100).toFixed(1)}% below the support at $${support.toFixed(2)}.`,
      invalidation: `A close back above $${support.toFixed(2)} would invalidate this breakdown.`,
      chartData: { type: "breakout", closes: win, resistance: support, breakPct: (-breakPct * 100).toFixed(1) },
    };
  }
  return null;
};

const detectBullFlag = (win) => {
  const n = win.length;
  if (n < 14) return null;
  const poleEnd = Math.floor(n * 0.6);
  const pole = win.slice(0, poleEnd);
  const flag = win.slice(poleEnd);
  const poleRise = (Math.max(...pole) - pole[0]) / pole[0];
  if (poleRise < 0.04) return null;
  const flagAvg = flag.reduce((a, b) => a + b, 0) / flag.length;
  const flagRange = (Math.max(...flag) - Math.min(...flag)) / flagAvg;
  if (flagRange > 0.04) return null;
  // flag should drift down or sideways
  if (flag[flag.length - 1] > flag[0] * 1.01) return null;
  const conf = poleRise > 0.08 ? 78 : 68;
  const target = flag[flag.length - 1] + (Math.max(...pole) - pole[0]);
  return {
    name: "Bull Flag",
    direction: "bullish",
    timeframe: inferTimeframe(n),
    confidence: conf,
    confidenceLevel: confLabel(conf),
    explanation: "A sharp rise followed by a small pullback — like a flag on a pole. Usually the price continues upward.",
    confirmationLevel: "Waiting for breakout above the flag",
    possibleEntry: `Above $${Math.max(...flag).toFixed(2)} (top of the flag)`,
    stopLoss: `Below $${Math.min(...flag).toFixed(2)} (bottom of the flag)`,
    reason: `Strong ${(poleRise * 100).toFixed(1)}% rally followed by tight ${(flagRange * 100).toFixed(1)}% consolidation.`,
    invalidation: `A break below $${Math.min(...flag).toFixed(2)} would turn this bearish.`,
    chartData: { type: "flag", closes: win, flagStart: poleEnd, poleRise: (poleRise * 100).toFixed(1) },
  };
};

const detectBearFlag = (win) => {
  const n = win.length;
  if (n < 14) return null;
  const poleEnd = Math.floor(n * 0.6);
  const pole = win.slice(0, poleEnd);
  const flag = win.slice(poleEnd);
  const poleDrop = (pole[0] - Math.min(...pole)) / pole[0];
  if (poleDrop < 0.04) return null;
  const flagAvg = flag.reduce((a, b) => a + b, 0) / flag.length;
  const flagRange = (Math.max(...flag) - Math.min(...flag)) / flagAvg;
  if (flagRange > 0.04) return null;
  // flag should drift up or sideways
  if (flag[flag.length - 1] < flag[0] * 0.99) return null;
  const conf = poleDrop > 0.08 ? 76 : 66;
  return {
    name: "Bear Flag",
    direction: "bearish",
    timeframe: inferTimeframe(n),
    confidence: conf,
    confidenceLevel: confLabel(conf),
    explanation: "A sharp drop followed by a small bounce — like an upside-down flag. Usually the price keeps falling.",
    confirmationLevel: "Waiting for breakdown below the flag",
    possibleEntry: `Short below $${Math.min(...flag).toFixed(2)}`,
    stopLoss: `Above $${Math.max(...flag).toFixed(2)} (top of the flag)`,
    reason: `Sharp ${(poleDrop * 100).toFixed(1)}% drop followed by tight ${(flagRange * 100).toFixed(1)}% bounce.`,
    invalidation: `A break above $${Math.max(...flag).toFixed(2)} would cancel this pattern.`,
    chartData: { type: "flag", closes: win, flagStart: poleEnd, poleRise: (-poleDrop * 100).toFixed(1) },
  };
};

const detectMACross = (win) => {
  const n = win.length;
  if (n < 60) return null;
  const shortP = Math.max(10, Math.floor(n * 0.08));
  const longP  = Math.max(20, Math.floor(n * 0.16));
  const maShort = calcMA(win, shortP);
  const maLong  = calcMA(win, longP);
  // Golden cross (bullish)
  for (let i = n - 8; i < n; i++) {
    if (maShort[i] && maLong[i] && maShort[i - 1] && maLong[i - 1]) {
      if (maShort[i] > maLong[i] && maShort[i - 1] <= maLong[i - 1]) {
        return {
          name: "Moving Average Cross",
          direction: "bullish",
          timeframe: inferTimeframe(n),
          confidence: 80,
          confidenceLevel: "high",
          explanation: "The short-term average crossed above the long-term average — a classic bullish signal.",
          confirmationLevel: "Confirmed — crossover occurred",
          possibleEntry: `At current price $${win[n - 1].toFixed(2)}`,
          stopLoss: `Below the long MA at ~$${maLong[i].toFixed(2)}`,
          reason: `${shortP}-period MA crossed above ${longP}-period MA in the last 8 bars.`,
          invalidation: `Short MA dropping back below long MA would cancel this signal.`,
          chartData: { type: "ma_cross", closes: win.slice(-60), ma50: maShort.slice(-60), ma200: maLong.slice(-60) },
        };
      }
      // Death cross (bearish)
      if (maShort[i] < maLong[i] && maShort[i - 1] >= maLong[i - 1]) {
        return {
          name: "Moving Average Cross",
          direction: "bearish",
          timeframe: inferTimeframe(n),
          confidence: 78,
          confidenceLevel: "high",
          explanation: "The short-term average crossed below the long-term average — a bearish warning signal.",
          confirmationLevel: "Confirmed — crossover occurred",
          possibleEntry: `Consider reducing exposure at $${win[n - 1].toFixed(2)}`,
          stopLoss: `Above the long MA at ~$${maLong[i].toFixed(2)}`,
          reason: `${shortP}-period MA crossed below ${longP}-period MA in the last 8 bars.`,
          invalidation: `Short MA rising back above long MA would cancel this signal.`,
          chartData: { type: "ma_cross", closes: win.slice(-60), ma50: maShort.slice(-60), ma200: maLong.slice(-60) },
        };
      }
    }
  }
  return null;
};

const detectVolumeSpike = (win) => {
  const n = win.length;
  if (n < 20) return null;
  // Detect unusually large single-bar moves (proxy for volume spikes)
  const changes = [];
  for (let i = 1; i < n; i++) changes.push(Math.abs((win[i] - win[i - 1]) / win[i - 1]));
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const lastChange = changes[changes.length - 1];
  const rawDir = win[n - 1] - win[n - 2];
  if (lastChange < avgChange * 2.5) return null;
  const dir = rawDir > 0 ? "bullish" : "bearish";
  const movePct = ((win[n - 1] - win[n - 2]) / win[n - 2] * 100).toFixed(2);
  const conf = lastChange > avgChange * 4 ? 80 : lastChange > avgChange * 3 ? 70 : 60;
  return {
    name: "Volume Spike + Price Move",
    direction: dir,
    timeframe: inferTimeframe(n),
    confidence: conf,
    confidenceLevel: confLabel(conf),
    explanation: `The price moved ${Math.abs(movePct)}% in one bar — much more than the average. This usually means large buyers or sellers stepped in.`,
    confirmationLevel: "Spike detected — watch next bars for follow-through",
    possibleEntry: dir === "bullish"
      ? `Above $${win[n - 1].toFixed(2)} if momentum continues`
      : `Below $${win[n - 1].toFixed(2)} if selling continues`,
    stopLoss: dir === "bullish"
      ? `Below $${win[n - 2].toFixed(2)} (pre-spike level)`
      : `Above $${win[n - 2].toFixed(2)} (pre-spike level)`,
    reason: `Last bar moved ${Math.abs(movePct)}%, which is ${(lastChange / avgChange).toFixed(1)}x the average bar size.`,
    invalidation: "If the next few bars fully reverse the spike, the signal is void.",
    chartData: { type: "breakout", closes: win, resistance: dir === "bullish" ? win[n - 2] : win[n - 1], breakPct: movePct },
  };
};

const detectCupAndHandle = (win) => {
  const n = win.length;
  if (n < 30) return null;
  const troughs = findTroughs(win, 3);
  const peaks = findPeaks(win, 3);
  if (troughs.length < 1 || peaks.length < 2) return null;
  // Look for U-shape: left rim peak, trough, right rim peak near left rim
  for (let li = 0; li < peaks.length - 1; li++) {
    const leftRim = peaks[li];
    for (let ti = 0; ti < troughs.length; ti++) {
      const bottom = troughs[ti];
      if (bottom.i <= leftRim.i) continue;
      for (let ri = li + 1; ri < peaks.length; ri++) {
        const rightRim = peaks[ri];
        if (rightRim.i <= bottom.i) continue;
        const cupDepth = 1 - bottom.v / ((leftRim.v + rightRim.v) / 2);
        const rimDiff = Math.abs(leftRim.v - rightRim.v) / ((leftRim.v + rightRim.v) / 2);
        const cupWidth = rightRim.i - leftRim.i;
        if (cupDepth > 0.05 && cupDepth < 0.35 && rimDiff < 0.06 && cupWidth >= 12) {
          // Handle: small pullback after right rim
          const handleZone = win.slice(rightRim.i);
          if (handleZone.length < 3) continue;
          const handleDip = 1 - Math.min(...handleZone) / rightRim.v;
          if (handleDip > 0.01 && handleDip < 0.10 && win[n - 1] >= rightRim.v * 0.95) {
            const rimAvg = (leftRim.v + rightRim.v) / 2;
            const target = rimAvg + (rimAvg - bottom.v);
            const conf = cupDepth > 0.10 && handleDip < 0.06 ? 78 : 65;
            return {
              name: "Cup & Handle",
              direction: "bullish",
              timeframe: inferTimeframe(n),
              confidence: conf,
              confidenceLevel: confLabel(conf),
              explanation: "The price formed a rounded bottom (the cup) and a small dip (the handle). This is a classic bullish pattern.",
              confirmationLevel: win[n - 1] > rightRim.v ? "Confirmed — handle breakout" : "Forming — handle in progress",
              possibleEntry: `Above $${rightRim.v.toFixed(2)} (rim breakout)`,
              stopLoss: `Below $${Math.min(...handleZone).toFixed(2)} (bottom of handle)`,
              reason: `Cup depth ${(cupDepth * 100).toFixed(1)}%, rims within ${(rimDiff * 100).toFixed(1)}%, handle dip ${(handleDip * 100).toFixed(1)}%.`,
              invalidation: `A break below $${Math.min(...handleZone).toFixed(2)} would break the handle and cancel the pattern.`,
              chartData: { type: "double_bottom", closes: win, idx1: leftRim.i, idx2: rightRim.i, support: bottom.v },
            };
          }
        }
      }
    }
  }
  return null;
};

const detectHeadAndShoulders = (win) => {
  const n = win.length;
  if (n < 20) return null;
  const sp = Math.max(3, Math.floor(n * 0.08));
  const peaks = findPeaks(win, 2);
  for (let pi = 0; pi < peaks.length - 2; pi++) {
    const [ls, head, rs] = [peaks[pi], peaks[pi + 1], peaks[pi + 2]];
    if (head.v > ls.v * 1.01 && head.v > rs.v * 1.01 &&
        Math.abs(ls.v - rs.v) / head.v < 0.07 &&
        (head.i - ls.i) >= sp && (rs.i - head.i) >= sp &&
        win[n - 1] < rs.v) {
      const t1 = Math.min(...win.slice(ls.i, head.i + 1));
      const t2 = Math.min(...win.slice(head.i, rs.i + 1));
      const neckline = (t1 + t2) / 2;
      const confirmed = win[n - 1] < neckline;
      const conf = confirmed ? 78 : 65;
      return {
        name: "Head & Shoulders",
        direction: "bearish",
        timeframe: inferTimeframe(n),
        confidence: conf,
        confidenceLevel: confLabel(conf),
        explanation: "Three peaks where the middle one is the highest — like a head between two shoulders. Usually signals a drop ahead.",
        confirmationLevel: confirmed ? "Confirmed — price below neckline" : "Forming — watch the neckline",
        possibleEntry: `Short below $${neckline.toFixed(2)} (neckline)`,
        stopLoss: `Above $${rs.v.toFixed(2)} (right shoulder)`,
        reason: `Head at $${head.v.toFixed(2)}, shoulders at ~$${ls.v.toFixed(2)} and $${rs.v.toFixed(2)}, neckline at $${neckline.toFixed(2)}.`,
        invalidation: `A close above $${rs.v.toFixed(2)} (right shoulder) would invalidate the pattern.`,
        chartData: { type: "hs", closes: win, peaks: [ls, head, rs], neckline },
      };
    }
  }
  return null;
};

const detectInverseHeadAndShoulders = (win) => {
  const n = win.length;
  if (n < 20) return null;
  const sp = Math.max(3, Math.floor(n * 0.08));
  const troughs = findTroughs(win, 2);
  for (let ti = 0; ti < troughs.length - 2; ti++) {
    const [ls, head, rs] = [troughs[ti], troughs[ti + 1], troughs[ti + 2]];
    if (head.v < ls.v * 0.99 && head.v < rs.v * 0.99 &&
        Math.abs(ls.v - rs.v) / ((ls.v + rs.v) / 2) < 0.07 &&
        (head.i - ls.i) >= sp && (rs.i - head.i) >= sp &&
        win[n - 1] > rs.v) {
      const p1 = Math.max(...win.slice(ls.i, head.i + 1));
      const p2 = Math.max(...win.slice(head.i, rs.i + 1));
      const neckline = (p1 + p2) / 2;
      const confirmed = win[n - 1] > neckline;
      const conf = confirmed ? 80 : 67;
      return {
        name: "Inverse Head & Shoulders",
        direction: "bullish",
        timeframe: inferTimeframe(n),
        confidence: conf,
        confidenceLevel: confLabel(conf),
        explanation: "Three valleys where the middle one is the deepest. This is the bullish mirror of Head & Shoulders and usually signals a rise.",
        confirmationLevel: confirmed ? "Confirmed — price above neckline" : "Forming — watch the neckline",
        possibleEntry: `Above $${neckline.toFixed(2)} (neckline)`,
        stopLoss: `Below $${rs.v.toFixed(2)} (right shoulder)`,
        reason: `Head at $${head.v.toFixed(2)}, shoulders at ~$${ls.v.toFixed(2)} and $${rs.v.toFixed(2)}, neckline at $${neckline.toFixed(2)}.`,
        invalidation: `A close below $${rs.v.toFixed(2)} (right shoulder) would invalidate this pattern.`,
        chartData: { type: "hs", closes: win, peaks: [ls, head, rs], neckline },
      };
    }
  }
  return null;
};

const detectDoubleTopBottom = (win) => {
  const n = win.length;
  if (n < 15) return null;
  const sp = Math.max(3, Math.floor(n * 0.08));
  const results = [];

  // Double Top
  const peaks = findPeaks(win, 2);
  for (let pi = 0; pi < peaks.length - 1; pi++) {
    const [p0, p1] = [peaks[pi], peaks[pi + 1]];
    if (p1.i - p0.i >= sp && Math.abs(p0.v - p1.v) / ((p0.v + p1.v) / 2) < 0.035) {
      const valley = Math.min(...win.slice(p0.i, p1.i + 1));
      if (win[n - 1] < valley * 1.03) {
        const confirmed = win[n - 1] < valley;
        const conf = confirmed ? 76 : 64;
        results.push({
          name: "Double Top",
          direction: "bearish",
          timeframe: inferTimeframe(n),
          confidence: conf,
          confidenceLevel: confLabel(conf),
          explanation: "The price tried to break above the same level twice and failed. This usually means sellers are strong there.",
          confirmationLevel: confirmed ? "Confirmed — valley broken" : "Forming — watching the valley",
          possibleEntry: `Short below $${valley.toFixed(2)} (valley between the two peaks)`,
          stopLoss: `Above $${Math.max(p0.v, p1.v).toFixed(2)} (the double top)`,
          reason: `Two peaks at ~$${p0.v.toFixed(2)} and $${p1.v.toFixed(2)}, separated by ${p1.i - p0.i} bars.`,
          invalidation: `A close above $${Math.max(p0.v, p1.v).toFixed(2)} would invalidate this pattern.`,
          chartData: { type: "double_bottom", closes: win, idx1: p0.i, idx2: p1.i, support: valley },
        });
        break;
      }
    }
  }

  // Double Bottom
  const troughs = findTroughs(win, 2);
  for (let mi = 0; mi < troughs.length - 1; mi++) {
    const [m0, m1] = [troughs[mi], troughs[mi + 1]];
    if (m1.i - m0.i >= sp && Math.abs(m0.v - m1.v) / ((m0.v + m1.v) / 2) < 0.035) {
      const peak = Math.max(...win.slice(m0.i, m1.i + 1));
      if (win[n - 1] > peak * 0.97) {
        const confirmed = win[n - 1] > peak;
        const conf = confirmed ? 77 : 65;
        results.push({
          name: "Double Bottom",
          direction: "bullish",
          timeframe: inferTimeframe(n),
          confidence: conf,
          confidenceLevel: confLabel(conf),
          explanation: "The price bounced off the same support level twice. Buyers are strong there — an upward move is likely.",
          confirmationLevel: confirmed ? "Confirmed — peak broken" : "Forming — watching the peak",
          possibleEntry: `Above $${peak.toFixed(2)} (peak between the two bottoms)`,
          stopLoss: `Below $${Math.min(m0.v, m1.v).toFixed(2)} (the double bottom)`,
          reason: `Two lows at ~$${m0.v.toFixed(2)} and $${m1.v.toFixed(2)}, separated by ${m1.i - m0.i} bars.`,
          invalidation: `A close below $${Math.min(m0.v, m1.v).toFixed(2)} would invalidate this pattern.`,
          chartData: { type: "double_bottom", closes: win, idx1: m0.i, idx2: m1.i, support: (m0.v + m1.v) / 2 },
        });
        break;
      }
    }
  }

  return results;
};


// ── MASTER DETECT ─────────────────────────────────────────────────────────────
export const detectOnWindow = win => {
  if (!win || win.length < 10) return [];
  const results = [];
  const push = r => { if (r) results.push(r); };

  push(detectBreakout(win));
  push(detectBreakdown(win));
  push(detectBullFlag(win));
  push(detectBearFlag(win));
  push(detectMACross(win));
  push(detectVolumeSpike(win));
  push(detectCupAndHandle(win));
  push(detectHeadAndShoulders(win));
  push(detectInverseHeadAndShoulders(win));
  // Double Top/Bottom returns an array
  const dtb = detectDoubleTopBottom(win);
  if (dtb) results.push(...dtb);

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);
  return results;
};

// Main entry point — auto mode uses correct window per pattern type
export const detectPatterns = (closes, customBars = null) => {
  if (!closes || closes.length < 10) return [];
  if (customBars) {
    const win = closes.slice(-Math.min(customBars, closes.length));
    return detectOnWindow(win).slice(0, 6);
  }
  // Auto mode: scan multiple windows for best coverage
  const n = closes.length;
  const found = new Map(); // deduplicate by pattern name

  // Short window (recent action)
  for (const p of detectOnWindow(closes.slice(-Math.min(30, n)))) {
    if (!found.has(p.name)) found.set(p.name, p);
  }
  // Medium window
  for (const p of detectOnWindow(closes.slice(-Math.min(90, n)))) {
    if (!found.has(p.name) || p.confidence > found.get(p.name).confidence) found.set(p.name, p);
  }
  // Full window (for long-term patterns)
  if (n >= 60) {
    for (const p of detectOnWindow(closes)) {
      if (!found.has(p.name) || p.confidence > found.get(p.name).confidence) found.set(p.name, p);
    }
  }

  return [...found.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
};

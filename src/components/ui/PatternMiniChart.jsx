import { useRef, useEffect } from "react";

// Loads Chart.js from CDN once, then builds the right dataset config
// for each of the 6 pattern types: ma_cross, breakout, double_bottom,
// flag, hs (head & shoulders), rsi_div.
export const PatternMiniChart = ({ chartData, patternName }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;
    const { type, closes } = chartData;
    const n = closes.length;

    const build = () => {
      if (!window.Chart) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

      const ds = [
        { label: "Price", data: closes, borderColor: "#7C3AED", borderWidth: 2,
          pointRadius: 0, tension: 0.2, fill: false },
      ];

      if (type === "ma_cross") {
        const { ma50, ma200 } = chartData;
        ds.push({ data: ma50,  borderColor: "#F59E0B", borderWidth: 1.5, pointRadius: 0, fill: false });
        ds.push({ data: ma200, borderColor: "#EF4444", borderWidth: 1.5, borderDash: [3,3], pointRadius: 0, fill: false });
      }
      if (type === "breakout") {
        const { resistance } = chartData;
        ds.push({ data: new Array(n).fill(resistance), borderColor: "#EF4444", borderWidth: 1.5, borderDash: [5,4], pointRadius: 0, fill: false });
        const pts = closes.map((v, i) => i >= n - 2 ? v : null);
        ds.push({ data: pts, borderColor: "transparent", pointBackgroundColor: "#22C55E", pointRadius: pts.map(p => p ? 7 : 0), pointBorderColor: "#fff", pointBorderWidth: 2, fill: false });
      }
      if (type === "double_bottom") {
        const { idx1, idx2, support } = chartData;
        ds.push({ data: new Array(n).fill(support), borderColor: "#22C55E", borderWidth: 1.5, borderDash: [4,4], pointRadius: 0, fill: false });
        const pts = closes.map((v, i) => (i === idx1 || i === idx2) ? v : null);
        ds.push({ data: pts, borderColor: "transparent", pointBackgroundColor: "#22C55E", pointRadius: pts.map(p => p ? 7 : 0), pointBorderColor: "#fff", pointBorderWidth: 2, fill: false });
      }
      if (type === "flag") {
        const { flagStart } = chartData;
        ds.push({ data: closes.map((v, i) => i < flagStart ? v : null), borderColor: "#3B82F6", borderWidth: 2.5, pointRadius: 0, fill: false });
        ds.push({ data: closes.map((v, i) => i >= flagStart ? v : null), borderColor: "#F59E0B", borderWidth: 2, pointRadius: 0, fill: false });
      }
      if (type === "hs") {
        const { peaks, neckline } = chartData;
        ds.push({ data: new Array(n).fill(neckline), borderColor: "#EF4444", borderWidth: 1.5, borderDash: [4,4], pointRadius: 0, fill: false });
        const cols = ["#F59E0B", "#EF4444", "#F59E0B"];
        const pts = closes.map((v, i) => { const p = peaks.find(pk => pk.i === i); return p ? v : null; });
        ds.push({ data: pts, borderColor: "transparent",
          pointBackgroundColor: closes.map((_, i) => { const p = peaks.find(pk => pk.i === i); return p ? cols[peaks.indexOf(p)] : "transparent"; }),
          pointRadius: pts.map(p => p ? 7 : 0), pointBorderColor: "#fff", pointBorderWidth: 2, fill: false });
      }
      if (type === "rsi_div") {
        const { peakIdx1, peakIdx2 } = chartData;
        const pts = closes.map((v, i) => (i === peakIdx1 || i === peakIdx2) ? v : null);
        ds.push({ data: pts, borderColor: "transparent",
          pointBackgroundColor: pts.map(p => p ? "#F59E0B" : "transparent"),
          pointRadius: pts.map(p => p ? 7 : 0), pointBorderColor: "#fff", pointBorderWidth: 2, fill: false });
      }

      chartRef.current = new window.Chart(canvasRef.current.getContext("2d"), {
        type: "line",
        data: { labels: closes.map((_, i) => `${i}`), datasets: ds },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "none" },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: {
              grid: { color: "#F3F4F6" },
              ticks: { maxTicksLimit: 3, font: { size: 9 }, color: "#9CA3AF", callback: v => "$" + v.toFixed(0) },
              border: { display: false },
            },
          },
        },
      });
    };

    if (window.Chart) { build(); }
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      s.onload = build;
      document.head.appendChild(s);
    }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [chartData]);

  return (
    <div style={{ position: "relative", height: 120 }}>
      <canvas ref={canvasRef} role="img" aria-label={`Pattern ${patternName}`} />
    </div>
  );
};

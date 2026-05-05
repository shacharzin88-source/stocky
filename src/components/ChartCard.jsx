import { useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { T, cc, cs } from "../constants/tokens";
import { Spinner } from "./ui/Badges";
import { TIMEFRAMES } from "../constants/patterns";

// Left card in the stock detail view:
// - Company name and sector
// - Timeframe selector (AUTO / 2W / 1M / 3M / 6M / 1Y)
// - TradingView interactive chart (loaded via CDN script)
// - Stats bar: price, 1D/1W/1M change, RSI, volume
// - Key Metrics side column pulled from fundamental data
export const ChartCard = ({
  activeStock, tech, fund, isTL, techError,
  selectedTF, onTFChange, onRetry, t,
}) => {
  const tvRef = useRef(null);

  // Mount / remount TradingView widget whenever the active stock or timeframe changes
  useEffect(() => {
    if (!activeStock || !tvRef.current) return;
    const cId = `tv_${activeStock.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`;
    tvRef.current.innerHTML = `<div id="${cId}" style="width:100%;height:100%;"></div>`;
    const tf = TIMEFRAMES.find(t => t.id === selectedTF) || TIMEFRAMES[0];
    const tvInterval = { "1d": "D", "1h": "60" }[tf.interval] || "D";

    const build = () => {
      if (!window.TradingView) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: activeStock.includes(":") ? activeStock : `NASDAQ:${activeStock}`,
        interval: tvInterval,
        timezone: "Asia/Jerusalem",
        theme: "light",
        style: "1",
        locale: "en",
        enable_publishing: false,
        container_id: cId,
        studies: ["RSI@tv-basicstudies"],
      });
    };

    if (window.TradingView) { build(); return; }
    const ex = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    if (ex) { ex.addEventListener("load", build); return; }
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/tv.js";
    s.async = true;
    s.onload = build;
    document.head.appendChild(s);
  }, [activeStock, selectedTF]);

  return (
    <div style={{
      background: T.surface, borderRadius: T.radiusLg, padding: 20,
      boxShadow: "0 2px 12px rgba(124,58,237,0.07)",
      display: "flex", gap: 16,
    }}>
      {/* ── CHART SIDE ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Company header + TF selector */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, direction: t.dir }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, textAlign: t.dir === "rtl" ? "right" : "left" }}>
              {fund?.companyName || activeStock}
            </p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0", textAlign: t.dir === "rtl" ? "right" : "left" }}>
              {activeStock}{fund?.sector ? ` · ${fund.sector}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 4, direction: "ltr", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {TIMEFRAMES.map(tf => (
              <button key={tf.id} onClick={() => onTFChange(tf.id)} style={{
                padding: "4px 10px", borderRadius: 99, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                background: selectedTF === tf.id ? T.purpleLight : "transparent",
                color: selectedTF === tf.id ? T.purple : T.textMuted,
                transition: "all 0.15s",
              }}>
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / error states */}
        {isTL && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0" }}>
            <Spinner /><span style={{ fontSize: 13, color: T.textMuted }}>{t.loading}</span>
          </div>
        )}
        {techError && !isTL && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0" }}>
            <span style={{ fontSize: 13, color: T.red }}>{techError}</span>
            <button onClick={onRetry} style={{
              fontSize: 12, color: T.purple, background: "none", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit",
            }}>
              <RefreshCw size={11} />{t.retry}
            </button>
          </div>
        )}

        {/* TradingView widget mount point */}
        <div ref={tvRef} style={{ height: 260, borderRadius: T.radiusSm, overflow: "hidden", background: T.bg }} />

        {/* Stats bar */}
        {tech && !isTL && (
          <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, flexWrap: "wrap", direction: "ltr" }}>
            {[
              [t.price,  `$${tech.price}`],
              ["1D",     `${cs(tech.change1d)}${tech.change1d}%`],
              ["1W",     `${cs(tech.change1w)}${tech.change1w}%`],
              ["1M",     `${cs(tech.change1m)}${tech.change1m}%`],
              ["RSI",    tech.rsi],
              ["Vol",    tech.volume],
            ].map(([l, v]) => (
              <div key={l}>
                <p style={{ fontSize: 10, color: T.textFaint, margin: "0 0 2px" }}>{l}</p>
                <p style={{
                  fontSize: 13, fontWeight: 700, margin: 0,
                  color: l === "1D" ? cc(tech.change1d) : l === "1W" ? cc(tech.change1w) : l === "1M" ? cc(tech.change1m) : T.text,
                }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── KEY METRICS SIDE ── */}
      {fund && (
        <div style={{
          flexShrink: 0, width: 150,
          borderLeft: `1.5px solid ${T.border}`, paddingLeft: 16,
          display: "flex", flexDirection: "column",
        }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: T.orange, margin: "0 0 10px", letterSpacing: "0.02em" }}>
            {t.keyMetrics}
          </p>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            {[
              ["P/E Ratio",       fund.peRatio],
              ["Mkt Cap",         fund.marketCap],
              ["Div. Yield",      fund.divYield],
              ["52W Range",       fund.week52Range],
              ["EPS",             fund.eps],
              ["Analyst Target",  fund.analystTarget],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 10, color: T.textFaint, margin: "0 0 1px" }}>{label}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {val}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

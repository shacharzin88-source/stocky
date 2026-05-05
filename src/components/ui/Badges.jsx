import { T } from "../../constants/tokens";

// ── SIGNAL BADGE — Bullish / Bearish / Warning pill ───────────────────────────
export const SignalBadge = ({ signal, size = "sm" }) => {
  const cfg = {
    bullish: { bg: T.green, label: "Bullish" },
    bearish: { bg: T.red,   label: "Bearish" },
    warning: { bg: T.amber, label: "Warning" },
  };
  const c = cfg[signal] || cfg.warning;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: size === "sm" ? "3px 10px" : "5px 16px",
      borderRadius: 99, background: c.bg, color: "#fff",
      fontSize: size === "sm" ? 10 : 13, fontWeight: 700, letterSpacing: "0.03em",
    }}>
      {c.label}
    </span>
  );
};

// ── RECO BADGE — Buy / Hold / Sell pill ───────────────────────────────────────
export const RecoBadge = ({ rec }) => {
  const cfg = {
    Buy:        { bg: T.purple, label: "Buy"        },
    Hold:       { bg: T.amber,  label: "Hold"       },
    Sell:       { bg: T.red,    label: "Sell"       },
    "Strong Buy":{ bg: T.green, label: "Strong Buy" },
  };
  const c = cfg[rec] || cfg.Hold;
  return (
    <span style={{
      display: "inline-flex", padding: "4px 16px",
      borderRadius: 99, background: c.bg, color: "#fff",
      fontSize: 12, fontWeight: 700,
    }}>
      {c.label}
    </span>
  );
};

// ── SPINNER ───────────────────────────────────────────────────────────────────
export const Spinner = ({ color = T.purple }) => (
  <div style={{
    width: 16, height: 16, borderRadius: "50%",
    border: `2px solid ${color}30`, borderTopColor: color,
    animation: "spin 0.8s linear infinite", flexShrink: 0,
  }} />
);

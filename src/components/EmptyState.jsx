import { T } from "../constants/tokens";

// Landing screen shown when no stock is selected.
// Shows hero greeting, feature cards, popular stock shortcuts, and how-it-works steps.
export const EmptyState = ({ t, selectedTF, loadTech, loadFund, lang, setStocks, setActiveStock, setSelectedPattern }) => {
  const handleQuickAdd = sym => {
    setStocks(p => p.includes(sym) ? p : [...p, sym]);
    setActiveStock(sym);
    setSelectedPattern(null);
    Promise.all([loadTech(sym, selectedTF), loadFund(sym, lang)]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "20px 0 4px", direction: t.dir }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>{t.hello}</p>
        <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>{t.helloSub}</p>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { emoji: "📈", title: t.feat1Title, desc: t.feat1Desc, bg: "#F0ECFB", border: "#D5CBF0", titleColor: T.purple },
          { emoji: "📰", title: t.feat2Title, desc: t.feat2Desc, bg: "#E8F7F1", border: "#B8DFCF", titleColor: T.green  },
          { emoji: "⚡", title: t.feat3Title, desc: t.feat3Desc, bg: "#FBF4E3", border: "#E8D9A8", titleColor: T.amber  },
        ].map(({ emoji, title, desc, bg, border, titleColor }) => (
          <div key={title} style={{
            background: bg, borderRadius: T.radiusLg, padding: "22px 18px",
            border: `1.5px solid ${border}`,
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8,
          }}>
            <span style={{ fontSize: 30 }}>{emoji}</span>
            <p style={{ fontSize: 14, fontWeight: 800, color: titleColor, margin: 0 }}>{title}</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.65, direction: t.dir }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Popular stocks */}
      <div style={{ background: T.surface, borderRadius: T.radiusLg, padding: "18px 20px", boxShadow: "0 2px 12px rgba(139,111,212,0.06)" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px", textAlign: t.dir === "rtl" ? "right" : "left" }}>
          {t.popular}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", direction: "ltr" }}>
          {[
            { sym: "AAPL", name: "Apple",     color: T.purple, bg: T.purpleLight },
            { sym: "NVDA", name: "Nvidia",    color: T.green,  bg: T.greenLight  },
            { sym: "TSLA", name: "Tesla",     color: T.red,    bg: T.redLight    },
            { sym: "MSFT", name: "Microsoft", color: T.blue,   bg: T.blueLight   },
            { sym: "AMZN", name: "Amazon",    color: T.orange, bg: T.orangeLight },
            { sym: "GOOG", name: "Google",    color: T.amber,  bg: T.amberLight  },
          ].map(({ sym, name, color, bg }) => (
            <button key={sym} onClick={() => handleQuickAdd(sym)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 99,
              background: bg, border: `1.5px solid ${color}35`,
              cursor: "pointer", fontFamily: "inherit", direction: "ltr",
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color }}>{sym}</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{
        background: `linear-gradient(135deg,${T.purpleDark},${T.purpleMid})`,
        borderRadius: T.radiusLg, padding: "20px 24px", color: "#fff",
      }}>
        <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 14px", opacity: 0.9, textAlign: t.dir === "rtl" ? "right" : "left" }}>
          {t.howTitle}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[[t.step1T, t.step1D], [t.step2T, t.step2D], [t.step3T, t.step3D]].map(([title, desc], n) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 8px", fontSize: 14, fontWeight: 800,
              }}>
                {n + 1}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>{title}</p>
              <p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { Bell, ChevronRight } from "lucide-react";
import { T } from "../constants/tokens";
import { PATTERN_INFO, TIMEFRAMES } from "../constants/patterns";
import { SignalBadge } from "./ui/Badges";
import { PatternMiniChart } from "./ui/PatternMiniChart";

// Displays detected technical patterns for the active stock.
// Each pattern row is expandable: click to reveal description, annotated mini chart,
// timeframe tip with quick-switch buttons, and the recommended action.
export const PatternsCard = ({
  tech, activeStock, selectedPattern, selectedTF, lang, t,
  onSelectPattern, onTFChange,
}) => {
  if (!tech) return null;
  const activeTF = TIMEFRAMES.find(tf => tf.id === selectedTF) || TIMEFRAMES[0];

  return (
    <div style={{ background: T.surface, borderRadius: T.radiusLg, padding: 20, boxShadow: "0 2px 12px rgba(139,111,212,0.07)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, direction: t.dir }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={13} color={T.purple} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{t.patternsTitle}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: T.textMuted, direction: "ltr" }}>
          {activeTF.label} · {activeTF.sub}
        </span>
        <span style={{ padding: "2px 10px", borderRadius: 99, background: T.purpleLight, color: T.purple, fontSize: 12, fontWeight: 700 }}>
          {tech.patterns?.length || 0} {t.patternsFound}
        </span>
      </div>

      {/* Explanation */}
      <div style={{ padding: "10px 12px", background: T.purpleLight, borderRadius: T.radiusSm, marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: T.purpleDark, margin: 0, lineHeight: 1.7, textAlign: t.dir === "rtl" ? "right" : "left", direction: t.dir }}>
          {t.patternExplain}
        </p>
      </div>

      {(!tech.patterns || tech.patterns.length === 0) && (
        <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>{t.patternsNone}</p>
      )}

      {/* Pattern rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(tech.patterns || []).map((p, i) => {
          const info = PATTERN_INFO[p.name];
          if (!info) return null;
          const isSel = selectedPattern?.name === p.name;
          const bgMap    = { bullish: T.greenLight, bearish: T.redLight, warning: T.amberLight };
          const borderMap = { bullish: "#B8DFCF",  bearish: "#E8C4C2",  warning: "#F9DFA0" };

          return (
            <div key={i}
              onClick={() => onSelectPattern(isSel ? null : p)}
              style={{
                padding: "12px 14px", borderRadius: T.radius, cursor: "pointer",
                background: isSel ? bgMap[info.signal] : T.bg,
                border: `1.5px solid ${isSel ? borderMap[info.signal] : T.border}`,
                transition: "all 0.2s",
                userSelect: "none",
                WebkitUserSelect: "none",
                direction: "ltr",
              }}
            >
              {/* Row header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isSel ? 10 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SignalBadge signal={info.signal} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{p.confidence}%</span>
                </div>
                <ChevronRight size={14} color={T.textFaint} style={{ transform: isSel ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
              </div>

              {/* Expanded detail */}
              {isSel && (
                <div>
                  <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 10px", textAlign: t.dir === "rtl" ? "right" : "left", direction: t.dir, lineHeight: 1.6 }}>
                    {info.description[lang] || info.description.he}
                  </p>

                  <PatternMiniChart chartData={p.chartData} patternName={p.name} />

                  {/* Timeframe tip */}
                  <div style={{ marginTop: 10, padding: "8px 10px", background: `${T.amber}15`, borderRadius: T.radiusSm, border: `1px solid ${T.amber}40` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.amber, margin: "0 0 3px" }}>
                      ⏱ {t.bestTFLabel}: {info.bestTFLabel[lang] || info.bestTFLabel.he}
                    </p>
                    <p style={{ fontSize: 11, color: T.amber, margin: "0 0 6px", direction: t.dir, textAlign: t.dir === "rtl" ? "right" : "left" }}>
                      {info.tfTip[lang] || info.tfTip.he}
                    </p>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: T.amber }}>{t.recommended}:</span>
                      {info.bestTF.map(tfId => {
                        const tf = TIMEFRAMES.find(tf2 => tf2.id === tfId);
                        const isAct = selectedTF === tfId;
                        return (
                          <button key={tfId} onClick={e => { e.stopPropagation(); onTFChange(tfId); }} style={{
                            fontSize: 11, padding: "3px 10px", borderRadius: 99,
                            background: isAct ? T.purple : T.surface,
                            color: isAct ? "#fff" : T.purple,
                            border: `1.5px solid ${T.purple}`,
                            cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                          }}>
                            {tf?.label} {tf?.sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p style={{ fontSize: 11, fontWeight: 700, color: T.text, margin: "10px 0 3px", textAlign: t.dir === "rtl" ? "right" : "left", direction: t.dir }}>
                    {t.recommendation}:
                  </p>
                  <p style={{ fontSize: 12, color: T.textMuted, margin: 0, textAlign: t.dir === "rtl" ? "right" : "left", direction: t.dir, lineHeight: 1.6 }}>
                    {info.action[lang] || info.action.he}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

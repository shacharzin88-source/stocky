import { RefreshCw } from "lucide-react";
import { T } from "../constants/tokens";
import { RecoBadge, Spinner } from "./ui/Badges";

// Right column card: AI-powered fundamental analysis.
// Shows Buy/Hold/Sell badge with confidence bar, a 2–3 sentence summary,
// and the 3 most recent news items sorted newest-first.
export const FundamentalCard = ({
  activeStock, fund, isFL, fundError, t, onRefresh,
}) => (
  <>
    {/* ── STOCKY SAYS ── */}
    <div style={{ background: T.purpleLight, borderRadius: T.radiusLg, padding: 20, boxShadow: "0 2px 12px rgba(139,111,212,0.12)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, direction: t.dir }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: T.purple }}>{t.stockySays}</span>
        {isFL && <Spinner color={T.purple} />}
        {!isFL && fund && (
          <button onClick={onRefresh} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.purple, display: "flex" }}>
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {isFL && <p style={{ fontSize: 13, color: T.purple, margin: 0, textAlign: t.dir === "rtl" ? "right" : "left" }}>{t.analyzingFund}</p>}

      {fundError && !isFL && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, direction: t.dir }}>
          <span style={{ fontSize: 12, color: T.red }}>{fundError}</span>
          <button onClick={onRefresh} style={{ fontSize: 12, color: T.purple, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3 }}>
            <RefreshCw size={11} />{t.retry}
          </button>
        </div>
      )}

      {fund && !isFL && (
        <div style={{ direction: "ltr" }}>
          {/* Recommendation + confidence bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <RecoBadge rec={fund.recommendation || "Hold"} />
            <div style={{ flex: 1, height: 8, borderRadius: 99, background: "rgba(139,111,212,0.15)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                background: `linear-gradient(90deg,${T.purple},${T.purpleMid})`,
                width: `${fund.recommendationScore || 50}%`,
                transition: "width 0.6s ease",
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.purple, flexShrink: 0 }}>
              {fund.recommendationScore || "—"}%
            </span>
          </div>
          {/* Summary */}
          {fund.summary && (
            <p style={{ fontSize: 12, color: T.purpleDark, lineHeight: 1.65, margin: 0, textAlign: t.dir === "rtl" ? "right" : "left", direction: t.dir }}>
              {fund.summary}
            </p>
          )}
        </div>
      )}

      {!fund && !isFL && !fundError && (
        <p style={{ fontSize: 13, color: T.purple, margin: 0, textAlign: t.dir === "rtl" ? "right" : "left" }}>...</p>
      )}
    </div>

    {/* ── LATEST NEWS ── */}
    {fund?.news?.length > 0 && !isFL && (
      <div style={{ background: T.surface, borderRadius: T.radiusLg, padding: 20, boxShadow: "0 2px 12px rgba(139,111,212,0.07)" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: "0 0 10px", textAlign: t.dir === "rtl" ? "right" : "left" }}>
          {t.newsTitle}{" "}
          <span style={{ fontSize: 10, color: T.textFaint, fontWeight: 400 }}>— {t.newsNewest}</span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {fund.news.slice(0, 3).map((item, i) => {
            const sb = item.sentiment === "positive" ? T.greenLight : item.sentiment === "negative" ? T.redLight : T.bg;
            const borderCol = item.sentiment === "positive" ? "#B8DFCF" : item.sentiment === "negative" ? "#E8C4C2" : T.border;
            return (
              <div key={i} style={{ padding: "8px 10px", background: sb, borderRadius: T.radiusSm, border: `1px solid ${borderCol}`, direction: t.dir }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3, flex: 1,
                    textAlign: t.dir === "rtl" ? "right" : "left",
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {item.title}
                  </p>
                  <span style={{ fontSize: 13, flexShrink: 0, direction: "ltr" }}>
                    {item.sentiment === "positive" ? "↑" : item.sentiment === "negative" ? "↓" : "→"}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: T.textFaint, margin: 0, textAlign: t.dir === "rtl" ? "right" : "left" }}>
                  {item.date}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </>
);

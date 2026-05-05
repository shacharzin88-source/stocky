import { Plus, Settings } from "lucide-react";
import { T } from "../constants/tokens";

// Top navigation bar: logo + tagline | nav tabs | language flags | API settings | search
export const Header = ({
  t, lang, activeTab, input, onTabChange, onLangSwitch,
  onInputChange, onAddStock, onOpenSettings,
}) => (
  <div style={{
    background: `linear-gradient(135deg, ${T.purpleDark} 0%, ${T.purple} 60%, ${T.purpleMid} 100%)`,
    padding: "12px 20px", flexShrink: 0,
  }}>
    <div style={{ display: "flex", alignItems: "stretch", gap: 20, direction: "ltr" }}>

      {/* Logo + name + tagline */}
      <div style={{
        display: "flex", alignItems: "center", gap: 13,
        paddingRight: 20, borderRight: "1px solid rgba(255,255,255,0.15)",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: T.purpleLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 3px 12px ${T.purple}50`, flexShrink: 0,
        }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <text x="15" y="26" textAnchor="middle" fontSize="28" fontWeight="900"
              fontFamily="'Nunito','Segoe UI',sans-serif" fill={T.purple}>S</text>
            <polygon points="23,4 19,14.5 22.5,14 19,26 27,12.5 23,13"
              fill="#F5C842" stroke="#D4A012" strokeWidth="0.4" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{
            fontSize: 24, fontWeight: 900, color: "#fff",
            letterSpacing: "-0.03em", fontFamily: "'Nunito','Segoe UI',sans-serif",
            lineHeight: 1.1, display: "block",
          }}>
            {t.appName}
          </span>
          <span style={{
            fontSize: 11, color: "rgba(255,255,255,0.65)",
            fontWeight: 500, letterSpacing: "0.03em", marginTop: 3,
          }}>
            Your Investments Buddy ⚡
          </span>
        </div>
      </div>

      {/* Right: nav row + search row */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, gap: 10 }}>
        {/* Nav row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[[t.explore, "explore"], [t.watchlist, "watchlist"], [t.portfolio, "portfolio"]].map(([label, id]) => (
              <button key={id} onClick={() => onTabChange(id)} style={{
                padding: "6px 16px", borderRadius: 99, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                background: activeTab === id ? "rgba(255,255,255,0.25)" : "transparent",
                color: "#fff", transition: "background 0.15s",
              }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Language flags */}
            <div style={{
              display: "flex", alignItems: "center", gap: 2,
              padding: "3px 5px", borderRadius: 9, background: "rgba(255,255,255,0.12)",
            }}>
              {[["he", "🇮🇱", "עברית"], ["en", "🇺🇸", "English"]].map(([l, flag, title]) => (
                <button key={l} onClick={() => onLangSwitch(l)} title={title} style={{
                  padding: "2px 5px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: lang === l ? "rgba(255,255,255,0.9)" : "transparent",
                  fontSize: 17, lineHeight: 1, transition: "background 0.15s",
                }}>
                  {flag}
                </button>
              ))}
            </div>
            {/* Settings */}
            <button onClick={onOpenSettings} style={{
              padding: "6px 11px", borderRadius: 99, border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.15)", color: "#fff",
              display: "flex", alignItems: "center", gap: 4,
              fontFamily: "inherit", fontSize: 12,
            }}>
              <Settings size={12} /> API
            </button>
          </div>
        </div>

        {/* Search row */}
        <div style={{ display: "flex", gap: 8, direction: t.dir }}>
          <input
            value={input}
            onChange={e => onInputChange(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && onAddStock()}
            placeholder={t.addPlaceholder}
            style={{
              flex: 1, maxWidth: 360, background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 99,
              padding: "8px 18px", fontSize: 13, color: "#fff", outline: "none",
              fontFamily: "inherit", direction: "ltr", textAlign: "left",
            }}
          />
          <button onClick={onAddStock} style={{
            padding: "8px 20px", borderRadius: 99, background: "rgba(255,255,255,0.9)",
            color: T.purple, fontSize: 13, fontWeight: 700, border: "none",
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
          }}>
            <Plus size={14} /> {t.addBtn}
          </button>
        </div>
      </div>
    </div>
  </div>
);

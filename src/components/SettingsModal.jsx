import { useState } from "react";
import { X } from "lucide-react";
import { T } from "../constants/tokens";

// Modal for entering Alpha Vantage and Finnhub API keys.
// Keys are persisted to window.storage so they survive page reloads.
export const SettingsModal = ({ apiKeys, onSave, onClose, t }) => {
  const [keys, setKeys] = useState({ ...apiKeys });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999, padding: 16,
    }}>
      <div style={{
        background: T.surface, borderRadius: T.radiusLg, padding: 24,
        maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(124,58,237,0.15)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20, direction: t.dir,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{t.apiTitle}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textFaint }}>
            <X size={18} />
          </button>
        </div>

        <p style={{
          fontSize: 11, color: T.textMuted, marginBottom: 16,
          textAlign: t.dir === "rtl" ? "right" : "left",
          direction: t.dir, lineHeight: 1.7,
        }}>
          {t.apiSub}
        </p>

        {/* API key inputs */}
        {[
          { id: "alphavantage", label: "Alpha Vantage", link: "https://www.alphavantage.co/support/#api-key" },
          { id: "finnhub",      label: "Finnhub",       link: "https://finnhub.io/register" },
        ].map(({ id, label, link }) => (
          <div key={id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, direction: t.dir }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</span>
              <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: T.purple }}>{t.freeKey}</a>
            </div>
            <input
              value={keys[id] || ""}
              onChange={e => setKeys(k => ({ ...k, [id]: e.target.value }))}
              placeholder={`${label} API Key`}
              style={{
                width: "100%", boxSizing: "border-box", background: T.bg,
                border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
                padding: "9px 12px", fontSize: 13, color: T.text,
                outline: "none", fontFamily: "inherit", direction: "ltr", textAlign: "left",
              }}
            />
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={() => { onSave(keys); onClose(); }}
            style={{
              flex: 1, padding: "11px",
              background: `linear-gradient(135deg,${T.purple},${T.purpleMid})`,
              color: "#fff", fontSize: 13, fontWeight: 700,
              border: "none", borderRadius: T.radiusSm, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t.save}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "11px 18px", background: T.bg, color: T.textMuted,
              fontSize: 13, border: `1.5px solid ${T.border}`,
              borderRadius: T.radiusSm, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};

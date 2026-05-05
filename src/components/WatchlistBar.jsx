import { Bell, X } from "lucide-react";
import { T, cc, cs } from "../constants/tokens";
import { Spinner } from "./ui/Badges";

// Two rows: chip bar (symbol + change%) and price tiles (symbol + big price + change%)
export const WatchlistBar = ({
  stocks, activeStock, techData, techLoading, fundLoading,
  onSelect, onRemove, t,
}) => (
  <>
    {/* ── CHIPS ── */}
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", direction: t.dir }}>
      {stocks.map(sym => {
        const td = techData[sym];
        const isA = sym === activeStock;
        return (
          <button key={sym} onClick={() => onSelect(sym)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: T.radius,
            background: isA ? `linear-gradient(135deg,${T.purpleDark},${T.purple})` : T.surface,
            border: `2px solid ${isA ? T.purple : T.border}`,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: isA ? "0 4px 14px rgba(139,111,212,0.25)" : "none",
            transition: "all 0.2s", direction: "ltr",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isA ? "#fff" : T.text }}>{sym}</span>
            {td && (
              <span style={{ fontSize: 12, fontWeight: 600, color: isA ? "rgba(255,255,255,0.8)" : cc(td.change1d) }}>
                {cs(td.change1d)}{td.change1d}%
              </span>
            )}
            {(techLoading[sym] || fundLoading[sym]) && <Spinner color={isA ? "#fff" : T.purple} />}
            {td?.patterns?.length > 0 && <Bell size={11} color={isA ? "rgba(255,255,255,0.7)" : T.amber} />}
            <button onClick={e => onRemove(sym, e)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              color: isA ? "rgba(255,255,255,0.6)" : T.textFaint, display: "flex",
            }}>
              <X size={11} />
            </button>
          </button>
        );
      })}
    </div>

    {/* ── PRICE TILES ── */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
      {stocks.map(sym => {
        const td = techData[sym];
        const isPos = td ? parseFloat(td.change1d) >= 0 : true;
        return (
          <div key={sym} onClick={() => onSelect(sym)} style={{
            background: isPos ? T.greenLight : T.redLight,
            borderRadius: T.radius, padding: "12px 14px", cursor: "pointer",
            border: `1.5px solid ${isPos ? "#B8DFCF" : "#E8C4C2"}`,
            transition: "transform 0.15s", direction: "ltr",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: isPos ? T.green : T.red, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{sym}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: isPos ? T.green : T.red, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{td ? `$${td.price}` : "—"}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: isPos ? T.green : T.red, margin: 0 }}>{td ? `${cs(td.change1d)}${td.change1d}%` : "..."}</p>
          </div>
        );
      })}
    </div>
  </>
);

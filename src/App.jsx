import { useState, useEffect } from "react";

// ── Constants & utils
import { T }             from "./constants/tokens";
import { I18N }          from "./constants/i18n";
import { TIMEFRAMES }    from "./constants/patterns";
import { fetchStockData, fetchFundamental } from "./utils/api";
import { detectPatterns } from "./utils/technical";

// ── Components
import { Header }          from "./components/Header";
import { SettingsModal }   from "./components/SettingsModal";
import { EmptyState }      from "./components/EmptyState";
import { WatchlistBar }    from "./components/WatchlistBar";
import { ChartCard }       from "./components/ChartCard";
import { PatternsCard }    from "./components/PatternsCard";
import { FundamentalCard } from "./components/FundamentalCard";

// ── App — holds all shared state and coordinates data loading ─────────────────
export default function App() {
  // Stock list
  const [stocks,         setStocks]         = useState([]);
  const [activeStock,    setActiveStock]     = useState(null);
  const [input,          setInput]           = useState("");

  // Per-symbol data maps
  const [techData,       setTechData]        = useState({});
  const [fundData,       setFundData]        = useState({});
  const [techLoading,    setTechLoading]     = useState({});
  const [fundLoading,    setFundLoading]     = useState({});
  const [techError,      setTechError]       = useState({});
  const [fundError,      setFundError]       = useState({});

  // UI state
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [selectedTF,       setSelectedTF]      = useState("auto");
  const [showSettings,     setShowSettings]    = useState(false);
  const [activeTab,        setActiveTab]       = useState("explore");
  const [apiKeys,          setApiKeys]         = useState({ alphavantage: "", finnhub: "" });
  const [lang,             setLang]            = useState("he");
  const t = I18N[lang];

  // Persist API keys across sessions
  useEffect(() => {
    const load = async () => {
      try {
        const av = await window.storage.get("av_key");
        const fh = await window.storage.get("fh_key");
        setApiKeys({ alphavantage: av?.value || "", finnhub: fh?.value || "" });
      } catch (_) {}
    };
    load();
  }, []);

  const saveApiKeys = async keys => {
    setApiKeys(keys);
    try {
      await window.storage.set("av_key", keys.alphavantage);
      await window.storage.set("fh_key", keys.finnhub);
    } catch (_) {}
  };

  // ── DATA LOADING ────────────────────────────────────────────────────────────
  const loadTech = async (sym, tfId) => {
    const tf = TIMEFRAMES.find(t => t.id === tfId) || TIMEFRAMES[0];
    setTechLoading(p => ({ ...p, [sym]: true }));
    setTechError(p => ({ ...p, [sym]: null }));
    try {
      const data     = await fetchStockData(sym, tf.interval, tf.range, apiKeys);
      const patterns = detectPatterns(data.closes, tf.bars);
      setTechData(p => ({ ...p, [sym]: { ...data, patterns, tf: tfId } }));
    } catch (e) {
      setTechError(p => ({ ...p, [sym]: t.error }));
    } finally {
      setTechLoading(p => ({ ...p, [sym]: false }));
    }
  };

  const loadFund = async (sym, l) => {
    const useLang = l || lang;
    setFundLoading(p => ({ ...p, [sym]: true }));
    setFundError(p => ({ ...p, [sym]: null }));
    try {
      const data = await fetchFundamental(sym, useLang);
      setFundData(p => ({ ...p, [sym]: data }));
    } catch (e) {
      setFundError(p => ({ ...p, [sym]: t.error }));
    } finally {
      setFundLoading(p => ({ ...p, [sym]: false }));
    }
  };

  // ── STOCK MANAGEMENT ────────────────────────────────────────────────────────
  const addStock = async () => {
    const sym = input.trim().toUpperCase();
    if (!sym || stocks.includes(sym)) return;
    setStocks(p => [...p, sym]);
    setActiveStock(sym);
    setInput("");
    setSelectedPattern(null);
    await Promise.all([loadTech(sym, selectedTF), loadFund(sym, lang)]);
  };

  const removeStock = (sym, e) => {
    e.stopPropagation();
    const next = stocks.filter(s => s !== sym);
    setStocks(next);
    if (activeStock === sym) { setActiveStock(next[0] || null); setSelectedPattern(null); }
  };

  const selectStock = sym => { setActiveStock(sym); setSelectedPattern(null); };

  // ── LANGUAGE SWITCH ─────────────────────────────────────────────────────────
  const switchLang = newLang => {
    setLang(newLang);
    // Reload fundamentals for all stocks in the new language
    stocks.forEach(sym => loadFund(sym, newLang));
  };

  // ── TIMEFRAME SWITCH ────────────────────────────────────────────────────────
  const handleTFChange = tfId => {
    setSelectedTF(tfId);
    setSelectedPattern(null);
    if (activeStock) loadTech(activeStock, tfId);
  };

  // Derived
  const tech    = activeStock ? techData[activeStock]    : null;
  const fund    = activeStock ? fundData[activeStock]    : null;
  const isTL    = activeStock ? techLoading[activeStock] : false;
  const isFL    = activeStock ? fundLoading[activeStock] : false;
  const techErr = activeStock ? techError[activeStock]   : null;
  const fundErr = activeStock ? fundError[activeStock]   : null;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column", minHeight: "100vh",
      background: T.bg, fontFamily: "'Nunito','Segoe UI',sans-serif",
      color: T.text, direction: t.dir,
    }}>
      {/* ── HEADER ── */}
      <Header
        t={t} lang={lang} activeTab={activeTab} input={input}
        onTabChange={setActiveTab}
        onLangSwitch={switchLang}
        onInputChange={setInput}
        onAddStock={addStock}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>

        {/* Watchlist chips + price tiles (shown whenever at least one stock is tracked) */}
        {stocks.length > 0 && (
          <WatchlistBar
            stocks={stocks} activeStock={activeStock}
            techData={techData} techLoading={techLoading} fundLoading={fundLoading}
            onSelect={selectStock} onRemove={removeStock} t={t}
          />
        )}

        {/* Landing page (no stock selected) */}
        {!activeStock && (
          <EmptyState
            t={t} lang={lang} selectedTF={selectedTF}
            loadTech={loadTech} loadFund={loadFund}
            setStocks={setStocks} setActiveStock={setActiveStock}
            setSelectedPattern={setSelectedPattern}
          />
        )}

        {/* Stock detail: chart + patterns (left) | fundamental (right) */}
        {activeStock && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, alignItems: "start" }}>

            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ChartCard
                activeStock={activeStock} tech={tech} fund={fund}
                isTL={isTL} techError={techErr}
                selectedTF={selectedTF}
                onTFChange={handleTFChange}
                onRetry={() => loadTech(activeStock, selectedTF)}
                t={t}
              />
              {tech && !isTL && (
                <PatternsCard
                  tech={tech} activeStock={activeStock}
                  selectedPattern={selectedPattern}
                  selectedTF={selectedTF} lang={lang} t={t}
                  onSelectPattern={setSelectedPattern}
                  onTFChange={handleTFChange}
                />
              )}
            </div>

            {/* RIGHT COLUMN — sticky so it doesn't scroll away */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 16 }}>
              <FundamentalCard
                activeStock={activeStock} fund={fund}
                isFL={isFL} fundError={fundErr} t={t}
                onRefresh={() => loadFund(activeStock)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings modal (API keys) */}
      {showSettings && (
        <SettingsModal
          apiKeys={apiKeys} onSave={saveApiKeys}
          onClose={() => setShowSettings(false)} t={t}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.6); }
        button, input, textarea { font-family: inherit; }
      `}</style>
    </div>
  );
}

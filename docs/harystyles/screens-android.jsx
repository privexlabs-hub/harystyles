/* global React, Avatar, Btn, Icon */

// =============================================================
// ANDROID — Material 3 flavored screens, harystyles tokens
// =============================================================
function AndroidStatusBar() {
  return (
    <div style={{
      height: 28, padding: "6px 18px", display: "flex", justifyContent: "space-between",
      alignItems: "center", color: "var(--fg-strong)", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
    }}>
      <span>9:41</span>
      <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontSize: 11 }}>
        <span style={{ display: "inline-flex", gap: 1.5 }}>{[3,5,7,9].map(h => <span key={h} style={{ width: 2.5, height: h, background: "var(--fg-strong)", borderRadius: 1 }}/>)}</span>
        <span style={{ width: 22, height: 10, border: "1px solid var(--fg-strong)", borderRadius: 2, padding: 1 }}>
          <span style={{ display: "block", width: "70%", height: "100%", background: "var(--fg-strong)", borderRadius: 1 }}/>
        </span>
      </span>
    </div>
  );
}
function AndroidNavBar() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg)" }}>
      <span style={{ width: 110, height: 4, borderRadius: 999, background: "var(--fg-faint)" }}/>
    </div>
  );
}

function AndroidHome() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", paddingBottom: 28 }}>
      <AndroidStatusBar/>
      <header style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <window.HSLogomark size={24}/>
          <window.HSWordmark size={18}/>
        </div>
        <button style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 999, width: 36, height: 36, display: "grid", placeItems: "center", color: "var(--fg)" }}><Icon.search/></button>
      </header>

      <div style={{ padding: "8px 20px 0" }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--accent)", marginBottom: 6 }}>● THE LAMP IS LIT · 9:41 PM</div>
        <h1 className="title-display" style={{ margin: 0, fontSize: 32, lineHeight: 1.05 }}>
          Five letters<br/><span className="italic-display" style={{ color: "var(--accent)" }}>for tonight.</span>
        </h1>
      </div>

      {/* Feed cards — Material 3 elevated */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { t: "On the small grief of leaving a city", a: "Ines Marlowe", h: 25, m: "MELANCHOLY", min: 7, prem: false },
          { t: "A letter to the version of me who stayed", a: "Tomás Vega", h: 280, m: "TENDER", min: 12, prem: true },
          { t: "Notes from a sleepless April", a: "Saoirse Linn", h: 200, m: "RESTLESS", min: 5, prem: false },
        ].map(p => (
          <div key={p.t} style={{
            padding: 16, background: "var(--bg-elevated)", borderRadius: 16,
            border: "1px solid var(--border-soft)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Avatar name={p.a} hue={p.h} size={20}/>
              <span className="caption" style={{ color: "var(--fg)" }}>{p.a}</span>
              {p.prem && <span style={{ marginLeft: "auto", color: "var(--wine-300)", display: "inline-flex", alignItems: "center", gap: 4 }} className="mono"><Icon.lock/>PATRON</span>}
            </div>
            <div className="title-sm" style={{ fontSize: 17, marginBottom: 8 }}>{p.t}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <span className="mono" style={{ fontSize: 9, color: "var(--fg-faint)" }}>{p.min} MIN</span>
              <span className="mono" style={{ fontSize: 9, color: "var(--fg-faint)" }}>{p.m}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Material 3 FAB */}
      <button style={{
        position: "absolute", bottom: 80, right: 20,
        width: 56, height: 56, borderRadius: 16, border: 0,
        background: "var(--accent)", color: "var(--ink-1000)",
        boxShadow: "var(--shadow-md), var(--shadow-glow)",
        display: "grid", placeItems: "center", cursor: "pointer",
      }}><Icon.feather/></button>

      {/* Bottom nav (Material 3) */}
      <nav style={{
        position: "absolute", bottom: 28, left: 0, right: 0, height: 64,
        background: "var(--bg-raised)", borderTop: "1px solid var(--border-soft)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
      }}>
        {[
          { i: <Icon.candle/>, l: "Tonight", a: true },
          { i: <Icon.search/>, l: "Moods" },
          { i: <Icon.letter/>, l: "Letters" },
          { i: <Icon.bookmark/>, l: "Shelf" },
          { i: <Icon.user/>, l: "Me" },
        ].map(t => (
          <button key={t.l} style={{
            background: "none", border: 0, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color: t.a ? "var(--accent)" : "var(--fg-faint)",
          }}>
            <span style={{
              padding: "4px 16px", borderRadius: 999,
              background: t.a ? "color-mix(in oklch, var(--accent) 18%, transparent)" : "transparent",
            }}>{t.i}</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 10, letterSpacing: "0.04em" }}>{t.l}</span>
          </button>
        ))}
      </nav>
      <AndroidNavBar/>
    </div>
  );
}

function AndroidEditor() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", paddingBottom: 28 }}>
      <AndroidStatusBar/>
      <header style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-soft)" }}>
        <button style={{ background: "none", border: 0, color: "var(--fg)" }}><Icon.close/></button>
        <span className="mono" style={{ fontSize: 9 }}>DRAFT · SAVED 2 MIN AGO</span>
        <Btn size="sm" variant="primary">Publish</Btn>
      </header>
      <div style={{ padding: 20 }}>
        <input placeholder="Title" defaultValue="On the small grief of leaving a city" style={{
          width: "100%", border: 0, background: "transparent", color: "var(--fg-strong)",
          fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.1, fontVariationSettings: '"opsz" 144, "SOFT" 50',
          outline: "none", padding: 0, marginBottom: 12,
        }}/>
        <input placeholder="Subtitle, optional" defaultValue="A small inventory of what was left behind." style={{
          width: "100%", border: 0, background: "transparent", color: "var(--fg-muted)",
          fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, lineHeight: 1.4,
          outline: "none", padding: 0, marginBottom: 24,
        }}/>
        <div className="body-reading" style={{ fontSize: 17 }}>
          I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me.
          <span style={{ display: "inline-block", width: 1, height: 18, background: "var(--accent)", verticalAlign: "middle", marginLeft: 2, animation: "blink 1s infinite" }}/>
        </div>
      </div>
      {/* Toolbar */}
      <div style={{
        position: "absolute", bottom: 28, left: 0, right: 0,
        padding: "12px 16px", background: "var(--bg-raised)", borderTop: "1px solid var(--border-soft)",
        display: "flex", gap: 14, alignItems: "center", color: "var(--fg-muted)",
      }}>
        {["B", "I", "“"].map(s => <button key={s} style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: 0, color: "var(--fg)", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500 }}>{s}</button>)}
        <span style={{ width: 1, height: 24, background: "var(--border)" }}/>
        <button style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: 0, color: "var(--fg)" }}><Icon.highlight/></button>
        <button style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: 0, color: "var(--fg)" }}><Icon.plus/></button>
        <span style={{ marginLeft: "auto" }} className="mono">412 / ∞</span>
      </div>
      <AndroidNavBar/>
    </div>
  );
}

window.AndroidHome = AndroidHome;
window.AndroidEditor = AndroidEditor;

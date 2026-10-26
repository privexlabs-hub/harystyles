/* global React */

function Swatch({ token, role, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{
        height: 84, background: value, borderRadius: 10,
        border: "1px solid var(--border-soft)",
      }}/>
      <div className="mono" style={{ fontSize: 9, color: "var(--fg)" }}>{token}</div>
      <div className="caption" style={{ fontSize: 11 }}>{role}</div>
    </div>
  );
}

function PageColor() {
  return (
    <div style={{ background: "var(--bg)", padding: 56, minHeight: "100%" }}>
      <div className="eyebrow">03 · COLOR</div>
      <h1 className="title-display" style={{ margin: "8px 0 24px", fontSize: 56, lineHeight: 1.0 }}>
        Ink, lamp, wine, and a <span className="italic-display" style={{ color: "var(--accent)" }}>palette of moods.</span>
      </h1>
      <p className="body-reading" style={{ maxWidth: "60ch", color: "var(--fg-muted)", marginBottom: 40 }}>
        Defined in OKLCH so the dark and paper themes share the same perceptual brightness curve. Every neutral has a warm bias — never cool. Shadow tint is warm-purple, never black.
      </p>

      {/* Brand */}
      <div className="eyebrow" style={{ marginBottom: 14 }}>BRAND · LAMPLIGHT (AMBER)</div>
      <p className="body-sm" style={{ marginBottom: 16 }}>The single brand accent. Used sparingly: titles, primary CTAs, the lit lamp. Never gradients, never glows except on the lamp itself.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 10, marginBottom: 36 }}>
        {[50,100,200,300,400,500,600,700,800,900].slice(0,9).map(s => (
          <Swatch key={s} token={`--amber-${s}`} role={s === 500 ? "primary" : ""} value={`var(--amber-${s})`}/>
        ))}
      </div>

      {/* Wine */}
      <div className="eyebrow" style={{ marginBottom: 14 }}>SECONDARY · WINE</div>
      <p className="body-sm" style={{ marginBottom: 16 }}>Reserved for patron / premium signals. Never compete with brand amber.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 36 }}>
        {[100,300,500,700,900].map(s => (
          <Swatch key={s} token={`--wine-${s}`} role={s === 500 ? "patron" : ""} value={`var(--wine-${s})`}/>
        ))}
      </div>

      {/* Ink */}
      <div className="eyebrow" style={{ marginBottom: 14 }}>INK NEUTRALS · WARM-VIOLET BIAS</div>
      <p className="body-sm" style={{ marginBottom: 16 }}>Page surfaces. Top end (50–200) is the cream "vellum" — used as text in dark mode, as paper in light mode.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 36 }}>
        {[1000, 950, 900, 800, 700, 600].map(s => (
          <Swatch key={s} token={`--ink-${s}`} role={s === 950 ? "page bg" : s === 900 ? "card" : s === 800 ? "elevated" : s === 700 ? "divider" : ""} value={`var(--ink-${s})`}/>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 36 }}>
        {[500, 400, 300, 200, 100, 50].map(s => (
          <Swatch key={s} token={`--ink-${s}`} role={s === 100 ? "vellum text" : s === 200 ? "body" : s === 400 ? "muted" : s === 500 ? "subtle" : ""} value={`var(--ink-${s})`}/>
        ))}
      </div>

      {/* Semantic */}
      <div className="eyebrow" style={{ marginBottom: 14 }}>SEMANTIC ROLES</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 36 }}>
        <Swatch token="--bg" role="page" value="var(--bg)"/>
        <Swatch token="--bg-card" role="card" value="var(--bg-card)"/>
        <Swatch token="--bg-elevated" role="raised" value="var(--bg-elevated)"/>
        <Swatch token="--bg-scrim" role="modal scrim" value="var(--bg-scrim)"/>
        <Swatch token="--fg-strong" role="display" value="var(--fg-strong)"/>
        <Swatch token="--fg" role="body" value="var(--fg)"/>
        <Swatch token="--fg-muted" role="secondary" value="var(--fg-muted)"/>
        <Swatch token="--fg-subtle" role="tertiary" value="var(--fg-subtle)"/>
        <Swatch token="--border" role="hairline" value="var(--border)"/>
        <Swatch token="--border-strong" role="strong rule" value="var(--border-strong)"/>
        <Swatch token="--accent" role="brand action" value="var(--accent)"/>
        <Swatch token="--premium" role="patron" value="var(--premium)"/>
      </div>

      {/* Mood */}
      <div className="eyebrow" style={{ marginBottom: 14 }}>MOOD SWATCHES · DISCOVERY ONLY</div>
      <p className="body-sm" style={{ marginBottom: 16 }}>Used only on mood pickers, mood pills, and mood-tinted notebook cards. Never as primary brand color.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 36 }}>
        {[
          ["Tender", "var(--mood-tender)", "soft, ached, gentle"],
          ["Restless", "var(--mood-restless)", "won't sit still"],
          ["Melancholy", "var(--mood-melancholy)", "blue, low-lit"],
          ["Still", "var(--mood-still)", "quiet, observed"],
          ["Burning", "var(--mood-burning)", "alive, urgent"],
          ["Untethered", "var(--mood-untethered)", "drifting, light"],
        ].map(([k, v, d]) => (
          <div key={k}>
            <div style={{ height: 84, background: v, borderRadius: 10 }}/>
            <div className="title-sm" style={{ fontSize: 14, marginTop: 8 }}>{k}</div>
            <div className="caption" style={{ fontSize: 11 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* Pairings */}
      <div className="eyebrow" style={{ marginBottom: 14 }}>PAIRINGS · CONTRAST CHECK (WCAG AA)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { bg: "var(--bg)", fg: "var(--fg-strong)", label: "Display on page", sample: "the lamp is lit" },
          { bg: "var(--bg)", fg: "var(--accent)", label: "Accent on page", sample: "for tonight." },
          { bg: "var(--accent)", fg: "var(--ink-1000)", label: "Primary CTA", sample: "Become a patron" },
          { bg: "var(--bg-card)", fg: "var(--fg)", label: "Body in card", sample: "I packed the kettle last." },
          { bg: "var(--premium)", fg: "var(--ink-100)", label: "Patron CTA", sample: "Support Ines" },
          { bg: "var(--bg-elevated)", fg: "var(--fg-muted)", label: "Tertiary chip", sample: "7 MIN · MAR 14" },
        ].map(p => (
          <div key={p.label} style={{ background: p.bg, color: p.fg, padding: 24, borderRadius: 12, border: "1px solid var(--border-soft)" }}>
            <div className="mono" style={{ fontSize: 9, opacity: 0.6, marginBottom: 8, color: "inherit" }}>{p.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>{p.sample}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.PageColor = PageColor;

/* global React */

// =================== DESIGN SYSTEM PREVIEW ===================
function DSPreview() {
  return (
    <div style={{ background: "var(--bg)", padding: 48, minHeight: "100%" }}>
      <div style={{ marginBottom: 56 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>HARYSTYLES · DESIGN SYSTEM</div>
        <h1 className="title-display" style={{ margin: 0, fontSize: 64, lineHeight: 1.0 }}>
          Letters, not <span className="italic-display" style={{ color: "var(--accent)" }}>posts.</span>
        </h1>
        <p className="body-reading" style={{ marginTop: 16, maxWidth: "60ch", color: "var(--fg-muted)" }}>
          A reading sanctuary for emotional long-form writing. Dark by default. Slow on purpose.
          Patron-supported. No likes, no follower counts, no infinite feed.
        </p>
      </div>

      {/* Type */}
      <section style={{ marginBottom: 56 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>TYPE — FRAUNCES + INTER TIGHT + JET BRAINS MONO</div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, alignItems: "baseline", paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
          <div className="mono">DISPLAY · 88</div>
          <div className="title-hero" style={{ fontSize: 88 }}>The lamp is lit.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, alignItems: "baseline", padding: "18px 0", borderBottom: "1px solid var(--border-soft)" }}>
          <div className="mono">DISPLAY ITALIC · 48</div>
          <div className="title-display italic-display" style={{ fontSize: 48 }}>for tonight</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, alignItems: "baseline", padding: "18px 0", borderBottom: "1px solid var(--border-soft)" }}>
          <div className="mono">READING SERIF · 17</div>
          <div className="body-reading" style={{ maxWidth: "60ch" }}>I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, alignItems: "baseline", padding: "18px 0", borderBottom: "1px solid var(--border-soft)" }}>
          <div className="mono">UI SANS · 15</div>
          <div className="body-ui">Become a patron · 4 letters left tonight</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, alignItems: "baseline", padding: "18px 0" }}>
          <div className="mono">MONO LABEL · 11</div>
          <div className="mono">7 MIN · MELANCHOLY · MAR 14</div>
        </div>
      </section>

      {/* Color */}
      <section style={{ marginBottom: 56 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>COLOR — INK + LAMP + WINE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            ["--ink-950", "Page (deep)", "var(--ink-950)"],
            ["--ink-900", "Surface raised", "var(--ink-900)"],
            ["--ink-800", "Card", "var(--ink-800)"],
            ["--ink-700", "Divider", "var(--ink-700)"],
            ["--ink-200", "Body text", "var(--ink-200)"],
            ["--ink-100", "Strong text", "var(--ink-100)"],
          ].map(([k, l, v]) => (
            <div key={k}>
              <div style={{ height: 80, background: v, borderRadius: 10, border: "1px solid var(--border-soft)" }}/>
              <div className="mono" style={{ fontSize: 9, marginTop: 6 }}>{k}</div>
              <div className="caption" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            ["--amber-300", "var(--amber-300)"],
            ["--amber-500", "var(--amber-500)"],
            ["--amber-700", "var(--amber-700)"],
            ["--wine-300", "var(--wine-300)"],
            ["--wine-500", "var(--wine-500)"],
            ["--wine-700", "var(--wine-700)"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ height: 80, background: v, borderRadius: 10 }}/>
              <div className="mono" style={{ fontSize: 9, marginTop: 6 }}>{k}</div>
            </div>
          ))}
        </div>
        <div className="eyebrow" style={{ marginBottom: 14 }}>MOOD SWATCHES (DISCOVERY)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {[
            ["Tender", "var(--mood-tender)"],
            ["Restless", "var(--mood-restless)"],
            ["Melancholy", "var(--mood-melancholy)"],
            ["Still", "var(--mood-still)"],
            ["Burning", "var(--mood-burning)"],
            ["Untethered", "var(--mood-untethered)"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ height: 60, background: v, borderRadius: 999, opacity: 0.85 }}/>
              <div className="caption" style={{ fontSize: 11, marginTop: 6, color: "var(--fg)" }}>{k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Components */}
      <section>
        <div className="eyebrow" style={{ marginBottom: 14 }}>PRINCIPLES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
          {[
            ["No infinite feed.", "5 pieces a night, hand-picked. When you finish them, the app closes. Daily ration arrives at sunset."],
            ["No like button.", "No public counts. Highlight a sentence to react privately, or save the line as a card."],
            ["No follower counts.", "Audience size is between you and the writer. Patrons are addressed, not advertised."],
            ["Premium = patron, not paywall.", "$4/mo isn't 'unlock content' — it's a quiet vote of confidence in someone's voice."],
            ["Pen names welcome.", "Your reader knows your voice, not your résumé."],
            ["Soft fade, not hard wall.", "Locked content blurs and offers. It never shouts."],
          ].map(([t, d]) => (
            <div key={t} style={{ padding: 24, border: "1px solid var(--border-soft)", borderRadius: 14, background: "var(--bg-card)" }}>
              <div className="title-md" style={{ marginBottom: 10 }}>{t}</div>
              <p className="body-sm" style={{ margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
window.DSPreview = DSPreview;

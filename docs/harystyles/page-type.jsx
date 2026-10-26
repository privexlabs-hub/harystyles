/* global React */

// =============================================================
// TYPE PAGE
// =============================================================
function PageType() {
  const Row = ({ label, size, lh, ls, family, weight, italic, sample, varSettings }) => (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 200px", gap: 28, alignItems: "baseline", padding: "20px 0", borderBottom: "1px solid var(--border-soft)" }}>
      <div>
        <div className="mono" style={{ fontSize: 10 }}>{label}</div>
        <div className="caption" style={{ fontSize: 10, marginTop: 4 }}>{size}px / {lh} / {ls}</div>
      </div>
      <div style={{
        fontFamily: family,
        fontSize: size, lineHeight: lh,
        letterSpacing: ls, fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        color: "var(--fg-strong)",
        fontVariationSettings: varSettings,
      }}>{sample}</div>
      <div className="caption" style={{ fontSize: 10, color: "var(--fg-faint)" }}>
        {family.split(",")[0].replace(/"/g, "")}
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", padding: 56, minHeight: "100%" }}>
      <div className="eyebrow">02 · TYPE</div>
      <h1 className="title-display" style={{ margin: "8px 0 24px", fontSize: 56, lineHeight: 1.0 }}>
        Three families, one <span className="italic-display" style={{ color: "var(--accent)" }}>literary register.</span>
      </h1>

      {/* Family overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 48 }}>
        {[
          { name: "Fraunces", role: "Display + reading", note: "Variable. opsz 9→144, SOFT 0→100, italic. Used for titles, body reading, pull quotes.", family: "var(--font-display)", style: 'italic', weight: 400, soft: 100 },
          { name: "Inter Tight", role: "UI", note: "Tight, clean, performant at small sizes. Used for nav, buttons, captions, system copy.", family: "var(--font-ui)", weight: 500 },
          { name: "JetBrains Mono", role: "Metadata", note: "Used for read-time, dates, eyebrows, reaction counts, IDs. Always uppercase, tracked wide.", family: "var(--font-mono)", weight: 500 },
        ].map(f => (
          <div key={f.name} style={{ padding: 28, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
            <div style={{
              fontFamily: f.family, fontSize: 80, lineHeight: 1,
              fontWeight: f.weight, fontStyle: f.style || "normal",
              fontVariationSettings: f.soft ? `"opsz" 144, "SOFT" ${f.soft}` : undefined,
              color: "var(--fg-strong)", marginBottom: 14, letterSpacing: "-0.035em",
            }}>Aa</div>
            <div className="title-sm">{f.name}</div>
            <div className="mono" style={{ fontSize: 9, marginTop: 4, color: "var(--accent)" }}>{f.role.toUpperCase()}</div>
            <p className="body-sm" style={{ marginTop: 12 }}>{f.note}</p>
          </div>
        ))}
      </div>

      {/* Scale */}
      <div className="eyebrow" style={{ marginBottom: 8 }}>DISPLAY SCALE — FRAUNCES</div>
      <Row label="HERO · 7XL" size={120} lh={1.0} ls="-0.04em" family="var(--font-display)" weight={400} sample="Letters, tonight." varSettings='"opsz" 144, "SOFT" 30'/>
      <Row label="DISPLAY · 6XL" size={88} lh={1.05} ls="-0.035em" family="var(--font-display)" weight={400} sample="The lamp is lit." varSettings='"opsz" 144, "SOFT" 50'/>
      <Row label="DISPLAY ITALIC · 5XL" size={64} lh={1.05} ls="-0.025em" family="var(--font-display)" weight={400} italic sample="for tonight." varSettings='"opsz" 144, "SOFT" 100'/>
      <Row label="TITLE · 4XL" size={48} lh={1.1} ls="-0.022em" family="var(--font-display)" weight={400} sample="On the small grief of leaving" varSettings='"opsz" 144, "SOFT" 50'/>
      <Row label="TITLE · 3XL" size={36} lh={1.15} ls="-0.018em" family="var(--font-display)" weight={500} sample="A letter to the version that stayed" varSettings='"opsz" 96, "SOFT" 30'/>
      <Row label="TITLE · 2XL" size={28} lh={1.2} ls="-0.012em" family="var(--font-display)" weight={500} sample="Notes from a sleepless April"/>
      <Row label="TITLE · XL" size={23} lh={1.25} ls="-0.01em" family="var(--font-display)" weight={500} sample="What the river kept"/>

      <div className="eyebrow" style={{ marginTop: 40, marginBottom: 8 }}>READING — FRAUNCES BODY</div>
      <Row label="BODY · LG · 19" size={19} lh={1.7} ls="0" family="var(--font-body-serif)" weight={400} sample="I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me."/>
      <Row label="BODY · MD · 17" size={17} lh={1.8} ls="0" family="var(--font-body-serif)" weight={400} sample="The grief of leaving a place is not the grief of a person. It does not require permission, or warning."/>
      <Row label="PULLQUOTE · 28" size={28} lh={1.25} ls="-0.012em" family="var(--font-display)" weight={400} italic sample="They unfasten from us, slowly, the way a coat slips off a chair." varSettings='"opsz" 144, "SOFT" 100'/>

      <div className="eyebrow" style={{ marginTop: 40, marginBottom: 8 }}>UI — INTER TIGHT</div>
      <Row label="UI · LG · 17" size={17} lh={1.5} ls="0" family="var(--font-ui)" weight={500} sample="Become a patron"/>
      <Row label="UI · MD · 15" size={15} lh={1.5} ls="0.005em" family="var(--font-ui)" weight={400} sample="Read every letter Ines writes — including patron-only pieces."/>
      <Row label="UI · SM · 13" size={13} lh={1.45} ls="0.01em" family="var(--font-ui)" weight={400} sample="3 letters this month · 412 patrons"/>
      <Row label="CAPTION · 12" size={12} lh={1.4} ls="0.01em" family="var(--font-ui)" weight={400} sample="Cancel any time. 90% goes to the writer."/>

      <div className="eyebrow" style={{ marginTop: 40, marginBottom: 8 }}>METADATA — JETBRAINS MONO</div>
      <Row label="MONO · 11" size={11} lh={1.4} ls="0.18em" family="var(--font-mono)" weight={500} sample="7 MIN · MELANCHOLY · MAR 14"/>
      <Row label="EYEBROW · 11" size={11} lh={1.4} ls="0.18em" family="var(--font-ui)" weight={500} sample="ESSAY · MARCH 14, 2026"/>

      {/* Specimen */}
      <div className="eyebrow" style={{ marginTop: 56, marginBottom: 18 }}>SPECIMEN — A LETTER, IN FULL</div>
      <div style={{ padding: 40, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14, maxWidth: "72ch" }}>
        <div className="mono" style={{ marginBottom: 22 }}>ESSAY · 7 MIN · MELANCHOLY</div>
        <h2 className="title-display" style={{ margin: 0, fontSize: 44, lineHeight: 1.05 }}>
          On the small grief<br/><span className="italic-display">of leaving a city.</span>
        </h2>
        <p className="italic-display" style={{ marginTop: 18, fontSize: 19, color: "var(--fg-muted)" }}>
          A small inventory of what was left behind, and what came along by mistake.
        </p>
        <p className="body-reading dropcap" style={{ marginTop: 28 }}>
          I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me. The radiator had been broken since November, and for four months I had boiled water just to feel something hot in the kitchen.
        </p>
        <blockquote style={{ margin: "28px 0", padding: "0 24px", borderLeft: "2px solid var(--accent)" }}>
          <p className="pullquote" style={{ margin: 0 }}>We do not leave cities, I think. They unfasten from us, slowly, the way a coat slips off a chair.</p>
        </blockquote>
        <p className="body-reading">
          The boxes had agreed-upon names: <em>books</em>, <em>winter</em>, <em>kitchen</em>, <em>misc</em>. The last one swelled with the things that did not deserve a category. A single earring whose pair I had been mourning for two years.
        </p>
      </div>
    </div>
  );
}
window.PageType = PageType;

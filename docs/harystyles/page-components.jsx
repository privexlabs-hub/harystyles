/* global React, Btn, Icon, Avatar */

// =============================================================
// COMPONENTS CATALOG
// =============================================================
function PageComponents() {
  const [tab, setTab] = React.useState("letters");
  const [input, setInput] = React.useState("");
  const [toggle, setToggle] = React.useState(true);

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 48 }}>
      <div className="eyebrow" style={{ marginBottom: 16 }}>{title}</div>
      <div style={{ padding: 28, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", padding: 56, minHeight: "100%" }}>
      <div className="eyebrow">05 · COMPONENTS</div>
      <h1 className="title-display" style={{ margin: "8px 0 32px", fontSize: 56, lineHeight: 1.0 }}>
        The pieces, <span className="italic-display" style={{ color: "var(--accent)" }}>in isolation.</span>
      </h1>

      <Section title="BUTTONS · 3 SIZES × 5 VARIANTS">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {["sm","md","lg"].map(s => (
            <div key={s} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div className="mono" style={{ fontSize: 9, width: 36 }}>{s.toUpperCase()}</div>
              <Btn size={s} variant="primary">Become a patron</Btn>
              <Btn size={s} variant="secondary">Read later</Btn>
              <Btn size={s} variant="outline">Follow</Btn>
              <Btn size={s} variant="ghost">Cancel</Btn>
              <Btn size={s} variant="premium" icon={<Icon.candle/>}>Patron · $4/mo</Btn>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
            <div className="mono" style={{ fontSize: 9, width: 36 }}>ICN</div>
            <Btn size="md" variant="primary" icon={<Icon.feather/>}>Write a letter</Btn>
            <Btn size="md" variant="secondary" iconRight={<Icon.arrowRight/>}>Continue reading</Btn>
            <Btn size="md" variant="ghost" icon={<Icon.bookmark/>}>Keep</Btn>
          </div>
        </div>
      </Section>

      <Section title="BADGES + CHIPS">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { l: "PATRON", c: "var(--wine-300)", bg: "var(--wine-900)", icon: <Icon.lock/> },
            { l: "MELANCHOLY", c: "var(--mood-melancholy)", bg: "color-mix(in oklch, var(--mood-melancholy) 18%, var(--bg-card))" },
            { l: "TENDER", c: "var(--mood-tender)", bg: "color-mix(in oklch, var(--mood-tender) 18%, var(--bg-card))" },
            { l: "RESTLESS", c: "var(--mood-restless)", bg: "color-mix(in oklch, var(--mood-restless) 18%, var(--bg-card))" },
            { l: "BURNING", c: "var(--mood-burning)", bg: "color-mix(in oklch, var(--mood-burning) 18%, var(--bg-card))" },
            { l: "NEW", c: "var(--accent)", bg: "var(--accent-soft)" },
          ].map(b => (
            <span key={b.l} style={{
              padding: "6px 12px", borderRadius: 999,
              background: b.bg, color: b.c,
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>{b.icon}{b.l}</span>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["7 min", "essay", "patron-only", "march 2026"].map(t => (
            <span key={t} style={{
              padding: "6px 14px", borderRadius: 999,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              color: "var(--fg-muted)", fontFamily: "var(--font-ui)", fontSize: 12,
            }}>{t}</span>
          ))}
        </div>
      </Section>

      <Section title="INPUTS">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <div className="caption" style={{ marginBottom: 8 }}>Email</div>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="you@somewhere.coast" style={{
              width: "100%", padding: "12px 14px",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 10, color: "var(--fg)",
              fontFamily: "var(--font-ui)", fontSize: 15,
            }}/>
          </label>
          <label style={{ display: "block" }}>
            <div className="caption" style={{ marginBottom: 8 }}>Pen name <span style={{ color: "var(--fg-faint)" }}>(optional)</span></div>
            <input placeholder="Ines Marlowe" style={{
              width: "100%", padding: "12px 14px",
              background: "var(--bg-elevated)", border: "1px solid var(--accent)",
              borderRadius: 10, color: "var(--fg)",
              fontFamily: "var(--font-ui)", fontSize: 15,
              boxShadow: "0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent)",
            }}/>
          </label>
          <label style={{ display: "block", gridColumn: "1 / -1" }}>
            <div className="caption" style={{ marginBottom: 8 }}>About you</div>
            <textarea rows={3} placeholder="A line. A line break. A second line." style={{
              width: "100%", padding: "12px 14px",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 10, color: "var(--fg)",
              fontFamily: "var(--font-body-serif)", fontSize: 16, lineHeight: 1.6,
              resize: "vertical",
            }}/>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 12, gridColumn: "1 / -1" }}>
            <button onClick={() => setToggle(!toggle)} style={{
              width: 40, height: 24, borderRadius: 999,
              background: toggle ? "var(--accent)" : "var(--bg-elevated)",
              border: "1px solid var(--border)", padding: 2, cursor: "pointer",
              display: "flex", justifyContent: toggle ? "flex-end" : "flex-start",
              transition: "all var(--dur-2)",
            }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, background: toggle ? "var(--ink-1000)" : "var(--fg-muted)" }}/>
            </button>
            <span className="body-sm" style={{ color: "var(--fg)" }}>Open patron-only letters by default</span>
          </label>
        </div>
      </Section>

      <Section title="CARDS">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div style={{ padding: 20, background: "var(--bg-elevated)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 9, marginBottom: 12 }}>LETTER · ESSAY</div>
            <div className="title-sm" style={{ marginBottom: 6 }}>On small grief</div>
            <p className="body-sm" style={{ margin: 0 }}>I packed the kettle last. It seemed important.</p>
          </div>
          <div style={{ padding: 20, background: "var(--bg-elevated)", border: "1px solid var(--accent)", borderRadius: 14, boxShadow: "var(--shadow-glow)" }}>
            <div className="mono" style={{ fontSize: 9, marginBottom: 12, color: "var(--accent)" }}>FEATURED · TONIGHT</div>
            <div className="title-sm" style={{ marginBottom: 6 }}>What the river kept</div>
            <p className="body-sm" style={{ margin: 0 }}>My grandmother told me the river forgets nothing.</p>
          </div>
          <div style={{ padding: 20, background: "var(--bg-elevated)", border: "1px solid var(--border-soft)", borderLeft: "3px solid var(--mood-melancholy)", borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 9, marginBottom: 12, color: "var(--mood-melancholy)" }}>NOTEBOOK · 8 LETTERS</div>
            <div className="title-sm" style={{ marginBottom: 6 }}>Letters from a leaving city</div>
            <p className="body-sm" style={{ margin: 0 }}>A series. Read in order, or any order.</p>
          </div>
        </div>
      </Section>

      <Section title="TABS">
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-soft)", gap: 24 }}>
          {["letters", "patrons-only", "about"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "14px 0", background: "none", border: 0, cursor: "pointer",
              color: tab === t ? "var(--fg)" : "var(--fg-faint)",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, textTransform: "capitalize",
            }}>{t.replace("-", " ")}</button>
          ))}
        </div>
      </Section>

      <Section title="MENU">
        <div style={{ width: 240, padding: 6, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-md)" }}>
          {[
            ["Keep this line", <Icon.bookmark/>],
            ["Highlight", <Icon.highlight/>],
            ["Reply privately", <Icon.reply/>],
            ["Save as image card", <Icon.share/>],
          ].map(([l, i]) => (
            <button key={l} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "10px 12px", background: "none", border: 0, cursor: "pointer",
              color: "var(--fg)", fontFamily: "var(--font-ui)", fontSize: 14, borderRadius: 8,
            }}>{i}{l}</button>
          ))}
          <div style={{ height: 1, background: "var(--border-soft)", margin: 6 }}/>
          <button style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "10px 12px", background: "none", border: 0, cursor: "pointer",
            color: "var(--mood-burning)", fontFamily: "var(--font-ui)", fontSize: 14, borderRadius: 8,
          }}>Report this letter</button>
        </div>
      </Section>

      <Section title="TOAST · NOTIFICATION">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            padding: "14px 18px", background: "var(--bg-elevated)", border: "1px solid var(--accent)",
            borderRadius: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-md)",
            color: "var(--fg)",
          }}>
            <Icon.candle style={{ color: "var(--accent)" }}/>
            <span className="body-sm" style={{ color: "var(--fg)" }}>Kept. The line is on your shelf.</span>
          </div>
          <div style={{
            padding: "14px 18px", background: "var(--wine-900)", border: "1px solid var(--wine-500)",
            borderRadius: 12, display: "flex", alignItems: "center", gap: 12, color: "var(--wine-100)",
          }}>
            <Icon.lock/>
            <span className="body-sm" style={{ color: "var(--wine-100)" }}>You're now a patron of Ines. Welcome.</span>
          </div>
          <div style={{
            padding: "14px 18px", background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 12, display: "flex", alignItems: "center", gap: 12, color: "var(--fg-muted)",
          }}>
            <Icon.moon/>
            <span className="body-sm" style={{ color: "var(--fg)" }}>The lamp will be lit again at sunset.</span>
          </div>
        </div>
      </Section>

      <Section title="MODAL · PATRONAGE PROMPT">
        <div style={{
          maxWidth: 480, padding: 32, background: "var(--bg-card)",
          border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow-lg)",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999, margin: "0 auto 20px",
            background: "radial-gradient(circle, var(--amber-500) 0%, var(--amber-700) 70%)",
            display: "grid", placeItems: "center", color: "var(--ink-50)",
            boxShadow: "var(--shadow-glow)",
          }}><Icon.candle/></div>
          <div className="title-md" style={{ textAlign: "center", marginBottom: 8 }}>Keep the lamp lit</div>
          <p className="body-sm" style={{ textAlign: "center", margin: 0, marginBottom: 20 }}>
            For Ines, and for the writers like her.
          </p>
          <Btn variant="primary" size="md" full>Become a patron · $4/mo</Btn>
        </div>
      </Section>

      <Section title="AVATARS">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Avatar name="Ines" hue={25} size={32}/>
          <Avatar name="Tomás" hue={280} size={40}/>
          <Avatar name="Saoirse" hue={200} size={56}/>
          <Avatar name="Daniyar" hue={160} size={72}/>
          <Avatar name="Marisol" hue={10} size={88} ring/>
        </div>
      </Section>
    </div>
  );
}
window.PageComponents = PageComponents;

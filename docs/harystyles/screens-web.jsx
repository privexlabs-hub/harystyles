/* global React, Avatar, Btn, Icon */

// =============================================================
// WEB / DESKTOP — Studio dashboard + Editor
// =============================================================
function WebChrome({ children, title = "harystyles" }) {
  return (
    <div style={{
      width: "100%", height: "100%", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      borderRadius: 14, overflow: "hidden",
      border: "1px solid var(--border-soft)",
    }}>
      <div style={{ height: 38, background: "var(--ink-1000)", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
        <span style={{ display: "flex", gap: 7 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c }}/>)}
        </span>
        <span style={{ flex: 1, textAlign: "center", color: "var(--fg-faint)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
}
window.WebChrome = WebChrome;

function WebStudio() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: "100%", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{ background: "var(--bg-raised)", borderRight: "1px solid var(--border-soft)", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <window.HSLogomark size={28}/>
          <window.HSWordmark size={20}/>
        </div>
        <div style={{ padding: 12, background: "var(--bg-elevated)", borderRadius: 10, marginBottom: 16, border: "1px solid var(--border-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name="Ines" hue={25} size={28}/>
            <div style={{ flex: 1 }}>
              <div className="body-sm" style={{ color: "var(--fg)", fontWeight: 500 }}>Ines Marlowe</div>
              <div className="caption" style={{ fontSize: 10 }}>writing studio</div>
            </div>
          </div>
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>STUDIO</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            ["Letters", <Icon.letter/>, true],
            ["Drafts", <Icon.pencil/>],
            ["Notebooks", <Icon.bookmark/>],
            ["Patrons", <Icon.heart/>],
            ["Earnings", null, false, "$284"],
          ].map(([l, i, a, t]) => (
            <button key={l} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              background: a ? "color-mix(in oklch, var(--accent) 14%, transparent)" : "transparent",
              border: 0, cursor: "pointer", borderRadius: 8,
              color: a ? "var(--accent)" : "var(--fg-muted)",
              fontFamily: "var(--font-ui)", fontSize: 13, textAlign: "left",
            }}>
              {i ?? <span style={{ width: 20 }}/>}
              <span style={{ flex: 1 }}>{l}</span>
              {t && <span className="mono" style={{ fontSize: 10, color: "var(--fg)" }}>{t}</span>}
            </button>
          ))}
        </nav>
        <div className="eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>NOTEBOOKS</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            ["Letters from a leaving city", "var(--mood-melancholy)", 8],
            ["On loving slowly", "var(--mood-tender)", 12],
            ["Sleepless April", "var(--mood-restless)", 6],
          ].map(([l, c, n]) => (
            <button key={l} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              background: "transparent", border: 0, cursor: "pointer", borderRadius: 8,
              color: "var(--fg-muted)", fontFamily: "var(--font-ui)", fontSize: 13, textAlign: "left",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: c }}/>
              <span style={{ flex: 1 }}>{l}</span>
              <span className="mono" style={{ fontSize: 9 }}>{n}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ padding: 32, overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <div className="eyebrow">YOUR STUDIO</div>
            <h1 className="title-display" style={{ margin: "6px 0 0", fontSize: 40, lineHeight: 1.1 }}>
              Welcome back, <span className="italic-display" style={{ color: "var(--accent)" }}>Ines.</span>
            </h1>
            <p className="caption" style={{ marginTop: 6 }}>You've written 34 letters · 412 patrons read every one.</p>
          </div>
          <Btn variant="primary" size="lg" icon={<Icon.feather/>}>Write a letter</Btn>
        </div>

        {/* Stats — quiet, no graphs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { l: "PATRONS", v: "412", c: "+18 this month", h: "var(--accent)" },
            { l: "MONTHLY", v: "$1,648", c: "your share, after fees" },
            { l: "READ TONIGHT", v: "284", c: "across 3 letters" },
            { l: "KEPT LINES", v: "1,204", c: "all-time, by readers" },
          ].map(s => (
            <div key={s.l} style={{ padding: 22, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
              <div className="mono" style={{ fontSize: 9, color: s.h || "var(--fg-faint)" }}>{s.l}</div>
              <div className="title-display" style={{ fontSize: 36, lineHeight: 1.1, marginTop: 8 }}>{s.v}</div>
              <div className="caption" style={{ marginTop: 4 }}>{s.c}</div>
            </div>
          ))}
        </div>

        {/* Letters table */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 100px",
            padding: "14px 22px", borderBottom: "1px solid var(--border-soft)",
          }}>
            {["LETTER","STATUS","KEPT","PATRONS","WRITTEN"].map(h => (
              <div key={h} className="mono" style={{ fontSize: 9 }}>{h}</div>
            ))}
          </div>
          {[
            { t: "On the small grief of leaving a city", s: "PUBLIC", k: 412, p: 412, d: "Mar 14" },
            { t: "What the river kept", s: "PATRON", k: 284, p: 284, d: "Mar 8" },
            { t: "Loving someone who is leaving", s: "PUBLIC", k: 156, p: 412, d: "Mar 6" },
            { t: "A morning, a kettle, the cold", s: "DRAFT", k: 0, p: 0, d: "Mar 3" },
            { t: "Letters my mother never sent", s: "PUBLIC", k: 89, p: 412, d: "Feb 28" },
          ].map(r => (
            <div key={r.t} style={{
              display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 100px",
              padding: "16px 22px", borderTop: "1px solid var(--border-soft)",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {r.s === "DRAFT" ? <Icon.pencil style={{ color: "var(--fg-faint)" }}/> : r.s === "PATRON" ? <Icon.lock style={{ color: "var(--wine-300)" }}/> : <Icon.letter style={{ color: "var(--fg-muted)" }}/>}
                <div>
                  <div className="body-sm" style={{ color: "var(--fg)", fontWeight: 500 }}>{r.t}</div>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 10, color: r.s === "DRAFT" ? "var(--fg-faint)" : r.s === "PATRON" ? "var(--wine-300)" : "var(--fg-muted)" }}>{r.s}</div>
              <div className="mono-num" style={{ fontSize: 13, color: "var(--fg)" }}>{r.k}</div>
              <div className="mono-num" style={{ fontSize: 13, color: "var(--fg)" }}>{r.p}</div>
              <div className="caption">{r.d}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function WebEditor() {
  return (
    <div style={{ background: "var(--bg)", height: "100%", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button style={{ background: "none", border: 0, color: "var(--fg)" }}><Icon.back/></button>
          <span className="mono" style={{ fontSize: 9 }}>DRAFT · SAVED 12 SECONDS AGO</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn size="sm" variant="ghost">Preview</Btn>
          <Btn size="sm" variant="outline">Save as patron-only</Btn>
          <Btn size="sm" variant="primary">Publish letter</Btn>
        </div>
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: "60px 24px 100px" }}>
        <div style={{ maxWidth: "62ch", margin: "0 auto" }}>
          <div className="mono" style={{ marginBottom: 20 }}>ESSAY · UNDER NOTEBOOK: LETTERS FROM A LEAVING CITY</div>
          <div contentEditable suppressContentEditableWarning style={{
            fontFamily: "var(--font-display)", fontSize: 56, lineHeight: 1.05,
            color: "var(--fg-strong)", outline: "none", marginBottom: 16,
            fontVariationSettings: '"opsz" 144, "SOFT" 50', letterSpacing: "-0.025em",
          }}>On the small grief of leaving a city</div>
          <div contentEditable suppressContentEditableWarning style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, lineHeight: 1.4,
            color: "var(--fg-muted)", outline: "none", marginBottom: 40,
          }}>A small inventory of what was left behind, and what came along by mistake.</div>
          <div contentEditable suppressContentEditableWarning className="body-reading" style={{ fontSize: 19, lineHeight: 1.8, outline: "none" }}>
            <p>I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me. The radiator had been broken since November, and for four months I had boiled water just to feel something hot in the kitchen.</p>
            <p>The boxes had agreed-upon names: <em>books</em>, <em>winter</em>, <em>kitchen</em>, <em>misc</em>. The last one swelled with the things that did not deserve a category.</p>
            <blockquote style={{ margin: "32px 0", padding: "0 24px", borderLeft: "2px solid var(--accent)" }}>
              <p className="pullquote" style={{ margin: 0 }}>We do not leave cities, I think. They unfasten from us, slowly, the way a coat slips off a chair.</p>
            </blockquote>
            <p style={{ color: "var(--fg-faint)" }}>Continue…</p>
          </div>
        </div>
      </div>
      {/* Floating selection toolbar */}
      <div style={{
        position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
        padding: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 999, boxShadow: "var(--shadow-md)",
        display: "flex", gap: 6, alignItems: "center",
      }}>
        {["B", "I", "“", "—"].map(s => <button key={s} style={{ width: 36, height: 36, borderRadius: 999, background: "transparent", border: 0, color: "var(--fg)", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500 }}>{s}</button>)}
        <span style={{ width: 1, height: 20, background: "var(--border)" }}/>
        <button style={{ width: 36, height: 36, borderRadius: 999, background: "transparent", border: 0, color: "var(--fg)" }}><Icon.highlight/></button>
        <span style={{ width: 1, height: 20, background: "var(--border)" }}/>
        <button style={{ height: 36, padding: "0 14px", borderRadius: 999, background: "var(--accent)", color: "var(--ink-1000)", border: 0, fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 500 }}>Add to notebook</button>
      </div>
    </div>
  );
}

function WebMarketing() {
  return (
    <div style={{ background: "var(--bg)", height: "100%", overflow: "auto" }}>
      {/* Nav */}
      <header style={{ padding: "20px 60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <window.HSLogomark size={28}/>
          <window.HSWordmark size={22}/>
        </div>
        <nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {["Read", "Write", "Patrons", "About"].map(l => (
            <a key={l} className="body-sm" style={{ color: "var(--fg)", textDecoration: "none" }}>{l}</a>
          ))}
          <Btn size="sm" variant="outline">Sign in</Btn>
          <Btn size="sm" variant="primary">Begin</Btn>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ padding: "100px 60px 80px", textAlign: "center" }}>
        <div className="mono" style={{ color: "var(--accent)", marginBottom: 18, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)", boxShadow: "var(--shadow-glow)" }}/>
          A QUIETER PLACE TO READ AND WRITE
        </div>
        <h1 style={{
          margin: 0, fontFamily: "var(--font-display)", fontSize: 120, lineHeight: 0.95, letterSpacing: "-0.04em",
          fontVariationSettings: '"opsz" 144, "SOFT" 30', color: "var(--fg-strong)", fontWeight: 400,
        }}>Letters,<br/><span style={{ fontStyle: "italic", color: "var(--accent)", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>not posts.</span></h1>
        <p className="body-reading" style={{
          margin: "32px auto 0", maxWidth: "52ch", fontSize: 19, color: "var(--fg-muted)",
        }}>
          Five letters every evening, hand-picked for the kind of mood you brought home. No infinite feed. No algorithm. No likes. Read by lamplight, support the writer if a piece moves you, and let the lamp go out at midnight.
        </p>
        <div style={{ marginTop: 40, display: "flex", gap: 14, justifyContent: "center" }}>
          <Btn size="lg" variant="primary" icon={<Icon.candle/>}>Begin reading tonight</Btn>
          <Btn size="lg" variant="outline" icon={<Icon.feather/>}>Write a letter</Btn>
        </div>
        <p className="caption" style={{ marginTop: 18, fontSize: 12 }}>Free to read. $4/mo to support a writer. Cancel any time.</p>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 60px", borderTop: "1px solid var(--border-soft)" }}>
        <div className="eyebrow" style={{ textAlign: "center", marginBottom: 14 }}>HOW IT FEELS</div>
        <h2 className="title-display" style={{ textAlign: "center", margin: "0 auto 60px", fontSize: 48, lineHeight: 1.05, maxWidth: "20ch" }}>
          Built for the way you actually <span className="italic-display" style={{ color: "var(--accent)" }}>want to read.</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { i: <Icon.candle/>, t: "A daily ration of five", d: "When the lamp is lit, five hand-picked letters appear. When you finish them, the app puts itself away. Sunset to sunset, that's it." },
            { i: <Icon.heart/>, t: "Read by feeling", d: "Tender. Restless. Melancholy. Burning. Pick the mood you arrived in, and we'll meet you there. No topic tags, no trending. " },
            { i: <Icon.lock/>, t: "Patronage, not paywall", d: "If a writer's voice moves you, become a patron for $4/mo. 90% goes to them. No tiers, no ‘premium’ unlocks. Just gratitude with a balance attached." },
            { i: <Icon.bookmark/>, t: "Keep the lines that stay", d: "Highlight a sentence. Save it as a card. Build a private shelf of the lines that hold you. Reactions are between you and the writing." },
            { i: <Icon.feather/>, t: "Write in vellum", d: "A reading-quality editor with no formatting menus to fight. Just title, subtitle, body. Drop caps and pull quotes appear when they're earned." },
            { i: <Icon.moon/>, t: "Dark by default", d: "Most reading happens at night. Most platforms refuse to admit this. We don't. Toggle to paper if you read by morning light." },
          ].map(c => (
            <div key={c.t} style={{ padding: 28, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", marginBottom: 16 }}>{c.i}</div>
              <h3 className="title-md" style={{ margin: 0, marginBottom: 8 }}>{c.t}</h3>
              <p className="body-sm" style={{ margin: 0 }}>{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote / social proof — but quiet */}
      <section style={{ padding: "100px 60px", textAlign: "center", borderTop: "1px solid var(--border-soft)" }}>
        <div className="title-display" style={{ fontSize: 36, color: "var(--accent)", marginBottom: 24 }}>❦</div>
        <p className="pullquote" style={{ margin: "0 auto", fontSize: 36, lineHeight: 1.25, maxWidth: "26ch" }}>
          "It's the only place online I read slowly anymore."
        </p>
        <p className="caption" style={{ marginTop: 24, fontSize: 12 }}>— Saoirse L., reader · 2 years</p>
      </section>

      {/* Pricing */}
      <section style={{ padding: "100px 60px", borderTop: "1px solid var(--border-soft)" }}>
        <div className="eyebrow" style={{ textAlign: "center", marginBottom: 14 }}>NO PLANS, JUST PEOPLE</div>
        <h2 className="title-display" style={{ textAlign: "center", margin: "0 auto 60px", fontSize: 48, maxWidth: "26ch", lineHeight: 1.05 }}>
          You read for free. <span className="italic-display" style={{ color: "var(--accent)" }}>You support writers, one at a time.</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 880, margin: "0 auto" }}>
          <div style={{ padding: 36, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 18 }}>
            <div className="title-md" style={{ marginBottom: 6 }}>Reading</div>
            <div className="title-display" style={{ fontSize: 56, lineHeight: 1, color: "var(--fg-strong)" }}>Free</div>
            <p className="body-sm" style={{ marginTop: 14 }}>Five letters every evening. Mood-based discovery. Your shelf, your kept lines, your reactions. Always.</p>
            <Btn size="md" variant="outline" full style={{ marginTop: 24 }}>Begin reading</Btn>
          </div>
          <div style={{ padding: 36, background: "var(--bg-card)", border: "1px solid var(--accent)", borderRadius: 18, boxShadow: "var(--shadow-glow)" }}>
            <div className="title-md" style={{ marginBottom: 6 }}>Patron <span style={{ color: "var(--accent)" }}>·</span> per writer</div>
            <div className="title-display" style={{ fontSize: 56, lineHeight: 1, color: "var(--fg-strong)" }}>$4<span style={{ fontSize: 22, color: "var(--fg-faint)" }}>/mo</span></div>
            <p className="body-sm" style={{ marginTop: 14 }}>Become a patron of one writer at a time. Read every letter, including patron-only pieces. 90% goes directly to them.</p>
            <Btn size="md" variant="primary" full style={{ marginTop: 24 }}>Find a writer</Btn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "60px", borderTop: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <window.HSLogomark size={24}/>
            <window.HSWordmark size={18}/>
          </div>
          <p className="caption" style={{ maxWidth: "32ch" }}>A quieter place to read and write. The lamp will be lit again at sunset.</p>
        </div>
        <div style={{ display: "flex", gap: 40 }}>
          {[
            ["Read", ["Tonight","Moods","Writers"]],
            ["Write", ["Begin a letter","Patrons","Earnings"]],
            ["About", ["Manifesto","Press","Contact"]],
          ].map(([h, items]) => (
            <div key={h}>
              <div className="mono" style={{ fontSize: 9, marginBottom: 12 }}>{h.toUpperCase()}</div>
              {items.map(i => <div key={i} className="body-sm" style={{ marginBottom: 6 }}>{i}</div>)}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

window.WebStudio = WebStudio;
window.WebEditor = WebEditor;
window.WebMarketing = WebMarketing;

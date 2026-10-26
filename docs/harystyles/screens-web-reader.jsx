/* global React, Avatar, Btn, Icon, MoodPill */

// =============================================================
// WEB READER APP — distinct from the Writer's Studio
// Reader-side: Tonight, Moods, Reader, Writer page, Shelf
// =============================================================

function ReaderTopNav({ active = "tonight" }) {
  return (
    <header style={{
      height: 64, padding: "0 40px", borderBottom: "1px solid var(--border-soft)",
      display: "flex", alignItems: "center", gap: 32, background: "var(--bg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <window.HSLogomark size={24}/>
        <window.HSWordmark size={18}/>
      </div>
      <nav style={{ display: "flex", gap: 28, marginLeft: 24 }}>
        {[
          ["tonight", "Tonight"],
          ["moods", "Moods"],
          ["writers", "Writers"],
          ["shelf", "Your shelf"],
        ].map(([id, l]) => (
          <a key={id} style={{
            color: active === id ? "var(--fg)" : "var(--fg-muted)",
            fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: active === id ? 500 : 400,
            textDecoration: "none", position: "relative", paddingBottom: 2,
            borderBottom: active === id ? "1px solid var(--accent)" : "1px solid transparent",
          }}>{l}</a>
        ))}
      </nav>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", boxShadow: "var(--shadow-glow)" }}/>
          LAMP LIT · 9:41 PM
        </span>
        <button style={{
          width: 36, height: 36, borderRadius: 999, background: "var(--bg-elevated)",
          border: "1px solid var(--border)", color: "var(--fg)", cursor: "pointer",
          display: "grid", placeItems: "center",
        }}><Icon.search/></button>
        <Avatar name="You" size={32} hue={45}/>
      </div>
    </header>
  );
}

// ----- Tonight (the daily ration of 5) -----
function WebTonight() {
  return (
    <div style={{ background: "var(--bg)", height: "100%", display: "flex", flexDirection: "column" }}>
      <ReaderTopNav active="tonight"/>
      <div style={{ flex: 1, overflow: "auto" }}>
        <section style={{ padding: "60px 40px 40px", borderBottom: "1px solid var(--border-soft)", maxWidth: 1280, margin: "0 auto" }}>
          <div className="mono" style={{ marginBottom: 14, color: "var(--accent)" }}>● TONIGHT, MARCH 14 · FIVE LETTERS</div>
          <h1 style={{
            margin: 0, fontFamily: "var(--font-display)", fontSize: 88, lineHeight: 0.98,
            letterSpacing: "-0.035em", fontVariationSettings: '"opsz" 144, "SOFT" 30',
            color: "var(--fg-strong)", fontWeight: 400, maxWidth: "16ch",
          }}>You came home <span style={{ fontStyle: "italic", color: "var(--accent)", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>a little tender.</span></h1>
          <p className="body-reading" style={{ marginTop: 20, maxWidth: "52ch", color: "var(--fg-muted)", fontSize: 18 }}>
            Five letters, picked for the mood you arrived in. Read them in any order. The lamp goes out at midnight.
          </p>
          <div style={{ marginTop: 22, display: "flex", gap: 10, alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--fg-faint)" }}>NOT TENDER TONIGHT?</span>
            {["restless","melancholy","still","burning"].map(m => (
              <button key={m} style={{
                padding: "5px 12px", borderRadius: 999, background: "transparent",
                border: "1px solid var(--border)", color: "var(--fg-muted)",
                fontFamily: "var(--font-ui)", fontSize: 12, cursor: "pointer", textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
        </section>

        {/* Featured + 4 */}
        <section style={{ padding: "48px 40px 80px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40, marginBottom: 48 }}>
            {/* Featured */}
            <article style={{ cursor: "pointer" }}>
              <div style={{
                aspectRatio: "16 / 10", borderRadius: 14,
                background: "linear-gradient(135deg, var(--mood-tender), var(--wine-700))",
                position: "relative", overflow: "hidden", marginBottom: 20,
                border: "1px solid var(--border-soft)",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(circle at 30% 70%, transparent, rgba(0,0,0,0.5))",
                }}/>
                <span className="mono" style={{
                  position: "absolute", top: 16, left: 16,
                  background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: 999,
                  color: "var(--ink-100)", fontSize: 10, backdropFilter: "blur(8px)",
                }}>● FEATURED · TONIGHT</span>
              </div>
              <div className="mono" style={{ fontSize: 9, marginBottom: 10 }}>ESSAY · 7 MIN · TENDER</div>
              <h2 className="title-display" style={{ margin: 0, marginBottom: 14, fontSize: 44, lineHeight: 1.05, maxWidth: "20ch" }}>
                On the small grief of leaving a city
              </h2>
              <p className="body-reading" style={{ margin: 0, marginBottom: 16, color: "var(--fg-muted)", maxWidth: "50ch", fontSize: 17 }}>
                I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name="Ines" size={28} hue={25}/>
                <span className="body-sm" style={{ color: "var(--fg)" }}>Ines Marlowe</span>
                <span style={{ color: "var(--fg-faint)" }}>·</span>
                <span className="caption">412 patrons · 1.2k kept lines</span>
              </div>
            </article>

            {/* Side stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {[
                { t: "A letter to the version of me who stayed", a: "Tomás Vega", m: "TENDER", min: 12, h: 280, prem: true },
                { t: "Notes from a sleepless April", a: "Saoirse Linn", m: "RESTLESS", min: 5, h: 200 },
                { t: "What the river kept", a: "Daniyar Ahn", m: "STILL", min: 9, h: 160, prem: true },
                { t: "A morning, a kettle, the cold", a: "Marisol Ortiz", m: "TENDER", min: 6, h: 10 },
              ].map(p => (
                <article key={p.t} style={{
                  display: "grid", gridTemplateColumns: "80px 1fr",
                  gap: 18, paddingBottom: 22, borderBottom: "1px solid var(--border-soft)",
                  cursor: "pointer",
                }}>
                  <div style={{
                    aspectRatio: "1", borderRadius: 10,
                    background: `linear-gradient(135deg, oklch(0.40 0.08 ${p.h}), oklch(0.20 0.04 ${p.h}))`,
                    border: "1px solid var(--border-soft)", position: "relative",
                  }}>
                    {p.prem && <span style={{ position: "absolute", top: 6, right: 6, color: "var(--wine-300)" }}><Icon.lock/></span>}
                  </div>
                  <div>
                    <h3 className="title-sm" style={{ margin: 0, marginBottom: 8, fontSize: 19, lineHeight: 1.25 }}>{p.t}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Avatar name={p.a} size={18} hue={p.h}/>
                      <span className="caption" style={{ color: "var(--fg)" }}>{p.a}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span className="mono" style={{ fontSize: 9, color: "var(--fg-faint)" }}>{p.min} MIN</span>
                      <span className="mono" style={{ fontSize: 9, color: "var(--fg-faint)" }}>{p.m}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "32px 0", borderTop: "1px solid var(--border-soft)", color: "var(--fg-faint)" }}>
            <div className="title-display" style={{ fontSize: 32, color: "var(--accent)", marginBottom: 10 }}>❦</div>
            <p className="body-sm">That's tonight's five. The lamp will be lit again at sunset.</p>
            <p className="caption" style={{ marginTop: 10 }}>Or browse <a style={{ color: "var(--accent)" }}>everything ever written</a>.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ----- Moods (read by feeling) -----
function WebMoods() {
  const moods = [
    { l: "Tender", c: "var(--mood-tender)", count: 312 },
    { l: "Restless", c: "var(--mood-restless)", count: 184 },
    { l: "Melancholy", c: "var(--mood-melancholy)", count: 421 },
    { l: "Still", c: "var(--mood-still)", count: 156 },
    { l: "Burning", c: "var(--mood-burning)", count: 98 },
    { l: "Untethered", c: "var(--mood-untethered)", count: 247 },
  ];

  return (
    <div style={{ background: "var(--bg)", height: "100%", display: "flex", flexDirection: "column" }}>
      <ReaderTopNav active="moods"/>
      <div style={{ flex: 1, overflow: "auto" }}>
        <section style={{ padding: "60px 40px 40px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="mono" style={{ marginBottom: 14 }}>READ BY FEELING — NOT BY TOPIC</div>
          <h1 className="title-display" style={{ margin: 0, fontSize: 64, lineHeight: 1.0, marginBottom: 18 }}>
            What did you bring <span className="italic-display" style={{ color: "var(--accent)" }}>home tonight?</span>
          </h1>
          <p className="body-reading" style={{ maxWidth: "52ch", color: "var(--fg-muted)", fontSize: 18 }}>
            Pick the mood you arrived in. We'll meet you there. No tags, no trending — just the kind of writing that fits the kind of evening you're having.
          </p>
        </section>

        {/* Mood grid */}
        <section style={{ padding: "20px 40px 40px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {moods.map(m => (
              <button key={m.l} style={{
                aspectRatio: "5 / 3", padding: 28, textAlign: "left",
                background: `color-mix(in oklch, ${m.c} 14%, var(--bg-card))`,
                border: `1px solid color-mix(in oklch, ${m.c} 40%, var(--border-soft))`,
                borderRadius: 16, color: "var(--fg)", cursor: "pointer",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "all var(--dur-2)",
              }}>
                <span style={{ width: 14, height: 14, borderRadius: 999, background: m.c, boxShadow: `0 0 24px ${m.c}` }}/>
                <div>
                  <div className="title-display" style={{ fontSize: 36, lineHeight: 1.0, color: "var(--fg-strong)" }}>{m.l}</div>
                  <div className="mono" style={{ fontSize: 10, marginTop: 8, color: m.c }}>{m.count} LETTERS</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Editorial picks for "Tender" */}
        <section style={{ padding: "60px 40px 80px", maxWidth: 1280, margin: "0 auto", borderTop: "1px solid var(--border-soft)", marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div className="mono" style={{ marginBottom: 8, color: "var(--mood-tender)" }}>● TENDER · 312 LETTERS</div>
              <h2 className="title-display" style={{ margin: 0, fontSize: 36 }}>For the kind of evening that <span className="italic-display" style={{ color: "var(--accent)" }}>asks for quiet.</span></h2>
            </div>
            <Btn size="sm" variant="ghost" iconRight={<Icon.arrowRight/>}>See all 312</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {[
              { t: "A small inventory of ordinary love", a: "Ines Marlowe", h: 25 },
              { t: "Letters my mother never sent", a: "Saoirse Linn", h: 200 },
              { t: "On loving someone who is leaving", a: "Tomás Vega", h: 280 },
              { t: "The light in the kitchen at 4am", a: "Marisol Ortiz", h: 10 },
            ].map(p => (
              <article key={p.t} style={{
                padding: 20, background: "var(--bg-card)", border: "1px solid var(--border-soft)",
                borderRadius: 14, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div className="mono" style={{ fontSize: 9 }}>ESSAY · 7 MIN</div>
                <h3 className="title-sm" style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{p.t}</h3>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={p.a} size={20} hue={p.h}/>
                  <span className="caption">{p.a}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ----- Reader (full-screen reading view) -----
function WebReader() {
  return (
    <div style={{ background: "var(--bg)", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Minimal reading nav */}
      <header style={{
        height: 56, padding: "0 32px", display: "flex", alignItems: "center", gap: 24,
        borderBottom: "1px solid var(--border-soft)", background: "var(--bg)",
      }}>
        <button style={{ background: "none", border: 0, color: "var(--fg)", cursor: "pointer" }}><Icon.back/></button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name="Ines" size={24} hue={25}/>
          <span className="body-sm" style={{ color: "var(--fg)", fontWeight: 500 }}>Ines Marlowe</span>
        </div>
        <div style={{
          flex: 1, height: 2, background: "var(--border-soft)", borderRadius: 999, position: "relative",
          maxWidth: 200, margin: "0 24px",
        }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "42%", background: "var(--accent)", borderRadius: 999 }}/>
        </div>
        <span className="mono" style={{ fontSize: 9 }}>3 MIN LEFT</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={{ width: 34, height: 34, borderRadius: 999, background: "transparent", border: "1px solid var(--border)", color: "var(--fg)", cursor: "pointer" }}><Icon.bookmark/></button>
          <Btn size="sm" variant="primary">Become a patron</Btn>
        </div>
      </header>

      {/* Article */}
      <div style={{ flex: 1, overflow: "auto", padding: "80px 40px" }}>
        <article style={{ maxWidth: "62ch", margin: "0 auto" }}>
          <div className="mono" style={{ marginBottom: 28 }}>ESSAY · MARCH 14, 2026 · TENDER · 7 MIN</div>
          <h1 className="title-display" style={{ margin: 0, fontSize: 64, lineHeight: 1.0, marginBottom: 24 }}>
            On the small grief<br/><span className="italic-display" style={{ color: "var(--accent)" }}>of leaving a city.</span>
          </h1>
          <p className="italic-display" style={{ fontSize: 22, color: "var(--fg-muted)", marginBottom: 40, lineHeight: 1.4 }}>
            A small inventory of what was left behind, and what came along by mistake.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 36, marginBottom: 36, borderBottom: "1px solid var(--border-soft)" }}>
            <Avatar name="Ines" size={40} hue={25}/>
            <div style={{ flex: 1 }}>
              <div className="body-sm" style={{ color: "var(--fg)", fontWeight: 500 }}>Ines Marlowe</div>
              <div className="caption">412 patrons · writes from Lisbon</div>
            </div>
            <Btn size="sm" variant="outline">Follow</Btn>
          </div>

          <p className="body-reading dropcap" style={{ fontSize: 19 }}>
            I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me. The radiator had been broken since November, and for four months I had boiled water just to feel something hot in the kitchen.
          </p>
          <p className="body-reading" style={{ fontSize: 19 }}>
            The boxes had agreed-upon names: <em>books</em>, <em>winter</em>, <em>kitchen</em>, <em>misc</em>. The last one swelled with the things that did not deserve a category. A single earring whose pair I had been mourning for two years. Three matches from a bar that had closed.
          </p>
          <blockquote style={{ margin: "40px 0", padding: "0 28px", borderLeft: "2px solid var(--accent)" }}>
            <p className="pullquote" style={{ margin: 0 }}>We do not leave cities, I think. They unfasten from us, slowly, the way a coat slips off a chair.</p>
          </blockquote>
          <p className="body-reading" style={{ fontSize: 19 }}>
            The grief of leaving a place is not the grief of a person. It does not require permission, or warning. It arrives quietly while you are taping a box, and it asks nothing of you except your attention.
          </p>

          {/* Soft fade paywall */}
          <div style={{ position: "relative", marginTop: 48 }}>
            <p className="body-reading" style={{ fontSize: 19, color: "var(--fg-muted)", maskImage: "linear-gradient(to bottom, black, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent)" }}>
              On the third morning, I sat on the floor of the empty kitchen and ate a pear. The light came in slowly, the way it always had, and I tried to memorize the shape of it…
            </p>
            <div style={{
              marginTop: 32, padding: 36, background: "var(--bg-card)",
              border: "1px solid var(--accent)", borderRadius: 18,
              textAlign: "center", boxShadow: "var(--shadow-glow)",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 999, margin: "0 auto 16px",
                background: "radial-gradient(circle, var(--amber-500), var(--amber-700))",
                display: "grid", placeItems: "center", color: "var(--ink-50)",
                boxShadow: "var(--shadow-glow)",
              }}><Icon.candle/></div>
              <div className="title-md" style={{ marginBottom: 8 }}>The rest of this letter is for patrons.</div>
              <p className="body-sm" style={{ margin: "0 auto 22px", maxWidth: "44ch" }}>
                Become a patron of Ines for $4/mo. Read every letter she's written, including the ones too tender for the open feed. 90% goes to her.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Btn size="md" variant="primary" icon={<Icon.candle/>}>Become Ines's patron · $4/mo</Btn>
                <Btn size="md" variant="ghost">Maybe later</Btn>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

// ----- Writer page (Ines's home on web) -----
function WebWriter() {
  return (
    <div style={{ background: "var(--bg)", height: "100%", display: "flex", flexDirection: "column" }}>
      <ReaderTopNav active="writers"/>
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Hero */}
        <section style={{
          padding: "60px 40px", borderBottom: "1px solid var(--border-soft)",
          background: "linear-gradient(180deg, color-mix(in oklch, var(--mood-tender) 8%, var(--bg)), var(--bg))",
        }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 32, alignItems: "center" }}>
            <Avatar name="Ines" size={120} hue={25} ring/>
            <div>
              <div className="mono" style={{ marginBottom: 10 }}>WRITER · LISBON · WRITING SINCE 2023</div>
              <h1 className="title-display" style={{ margin: 0, fontSize: 56, lineHeight: 1.0, marginBottom: 12 }}>
                Ines Marlowe
              </h1>
              <p className="italic-display" style={{ fontSize: 22, color: "var(--fg-muted)", margin: 0, marginBottom: 16, maxWidth: "44ch", lineHeight: 1.35 }}>
                "I write at night, mostly about leaving."
              </p>
              <div style={{ display: "flex", gap: 24 }}>
                <span className="body-sm"><strong style={{ color: "var(--fg)" }}>34</strong> letters</span>
                <span className="body-sm"><strong style={{ color: "var(--fg)" }}>3</strong> notebooks</span>
                <span className="body-sm"><strong style={{ color: "var(--fg)" }}>1,204</strong> kept lines</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn variant="primary" size="md" icon={<Icon.candle/>}>Become a patron · $4/mo</Btn>
              <Btn variant="outline" size="md">Follow for free</Btn>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border-soft)", padding: "0 40px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", gap: 32 }}>
            {[["Letters", true], ["Notebooks"], ["Patron-only", false, true], ["About"]].map(([l, a, lock]) => (
              <button key={l} style={{
                padding: "16px 0", background: "none", border: 0, cursor: "pointer",
                color: a ? "var(--fg)" : "var(--fg-muted)",
                borderBottom: `2px solid ${a ? "var(--accent)" : "transparent"}`,
                fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>{lock && <Icon.lock/>}{l}</button>
            ))}
          </div>
        </div>

        {/* Notebooks row */}
        <section style={{ padding: "40px", maxWidth: 1080, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>NOTEBOOKS — READ AS A SERIES</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
            {[
              { t: "Letters from a leaving city", n: 8, c: "var(--mood-melancholy)", d: "On Lisbon, on departure, on the small geographies of loss." },
              { t: "On loving slowly", n: 12, c: "var(--mood-tender)", d: "Twelve letters about the kind of love that doesn't announce itself." },
              { t: "Sleepless April", n: 6, c: "var(--mood-restless)", d: "Notes from a month of bad sleep and good light." },
            ].map(nb => (
              <div key={nb.t} style={{
                padding: 22, background: "var(--bg-card)",
                border: "1px solid var(--border-soft)", borderLeft: `3px solid ${nb.c}`,
                borderRadius: 14, cursor: "pointer",
              }}>
                <div className="mono" style={{ fontSize: 9, color: nb.c, marginBottom: 12 }}>NOTEBOOK · {nb.n} LETTERS</div>
                <h3 className="title-sm" style={{ margin: 0, marginBottom: 8 }}>{nb.t}</h3>
                <p className="body-sm" style={{ margin: 0 }}>{nb.d}</p>
              </div>
            ))}
          </div>

          {/* Letters list */}
          <div className="eyebrow" style={{ marginBottom: 16 }}>ALL LETTERS · NEWEST FIRST</div>
          <div>
            {[
              { t: "On the small grief of leaving a city", d: "Mar 14", min: 7, m: "TENDER", k: 412 },
              { t: "What the river kept", d: "Mar 8", min: 9, m: "STILL", k: 284, prem: true },
              { t: "Loving someone who is leaving", d: "Mar 6", min: 11, m: "TENDER", k: 156 },
              { t: "Letters my mother never sent", d: "Feb 28", min: 8, m: "MELANCHOLY", k: 89 },
              { t: "A morning, a kettle, the cold", d: "Feb 21", min: 5, m: "STILL", k: 62 },
              { t: "I don't know how to end this letter", d: "Feb 14", min: 6, m: "TENDER", k: 348, prem: true },
            ].map(l => (
              <article key={l.t} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto",
                gap: 24, alignItems: "center", padding: "20px 0",
                borderTop: "1px solid var(--border-soft)", cursor: "pointer",
              }}>
                <div>
                  <h3 className="title-sm" style={{ margin: 0, fontSize: 18, marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {l.prem && <Icon.lock style={{ color: "var(--wine-300)" }}/>}{l.t}
                  </h3>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span className="mono" style={{ fontSize: 9, color: "var(--fg-faint)" }}>{l.min} MIN</span>
                    <span className="mono" style={{ fontSize: 9, color: "var(--fg-faint)" }}>{l.m}</span>
                  </div>
                </div>
                <span className="mono-num" style={{ fontSize: 13 }}><span className="title-display" style={{ color: "var(--accent)", marginRight: 4 }}>❦</span>{l.k}</span>
                <span className="caption" style={{ minWidth: 60 }}>{l.d}</span>
                <Icon.arrowRight style={{ color: "var(--fg-faint)" }}/>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ----- Shelf (your kept lines + saved letters) -----
function WebShelf() {
  return (
    <div style={{ background: "var(--bg)", height: "100%", display: "flex", flexDirection: "column" }}>
      <ReaderTopNav active="shelf"/>
      <div style={{ flex: 1, overflow: "auto" }}>
        <section style={{ padding: "60px 40px 32px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="mono" style={{ marginBottom: 14 }}>YOUR SHELF · PRIVATE TO YOU</div>
          <h1 className="title-display" style={{ margin: 0, fontSize: 64, lineHeight: 1.0, marginBottom: 16 }}>
            The lines that <span className="italic-display" style={{ color: "var(--accent)" }}>stayed.</span>
          </h1>
          <p className="body-reading" style={{ maxWidth: "52ch", color: "var(--fg-muted)", fontSize: 17 }}>
            Sentences you kept while reading. Letters you saved for later. Patrons of yours. Yours alone — never shown to writers, never used to recommend things, never shared.
          </p>
        </section>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border-soft)", padding: "0 40px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 32 }}>
            {[["Kept lines", true, "1,204"], ["Saved letters", false, "47"], ["Patrons of", false, "3"]].map(([l, a, c]) => (
              <button key={l} style={{
                padding: "16px 0", background: "none", border: 0, cursor: "pointer",
                color: a ? "var(--fg)" : "var(--fg-muted)",
                borderBottom: `2px solid ${a ? "var(--accent)" : "transparent"}`,
                fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>{l} <span className="mono" style={{ fontSize: 10, color: "var(--fg-faint)" }}>{c}</span></button>
            ))}
          </div>
        </div>

        {/* Kept lines — masonry of quote cards */}
        <section style={{ padding: "40px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {[
              { q: "We do not leave cities, I think. They unfasten from us, slowly, the way a coat slips off a chair.", a: "Ines Marlowe", t: "On the small grief of leaving a city", c: "var(--mood-tender)" },
              { q: "I have been collecting goodbyes the way some people collect coins.", a: "Tomás Vega", t: "A letter to the version of me who stayed", c: "var(--mood-melancholy)" },
              { q: "The river forgets nothing. That is its kindness, and also its cruelty.", a: "Daniyar Ahn", t: "What the river kept", c: "var(--mood-still)" },
              { q: "Some mornings I am only the kettle, and the kettle is enough.", a: "Marisol Ortiz", t: "A morning, a kettle, the cold", c: "var(--mood-tender)" },
              { q: "April was a long room with no door at the end of it.", a: "Saoirse Linn", t: "Notes from a sleepless April", c: "var(--mood-restless)" },
              { q: "She wrote to her daughter every Sunday for forty years and never sent a single one.", a: "Ines Marlowe", t: "Letters my mother never sent", c: "var(--mood-melancholy)" },
            ].map(card => (
              <div key={card.q} style={{
                padding: 28, background: "var(--bg-card)",
                border: "1px solid var(--border-soft)", borderLeft: `3px solid ${card.c}`,
                borderRadius: 14, display: "flex", flexDirection: "column", gap: 16,
              }}>
                <div className="title-display" style={{ fontSize: 22, color: "var(--accent)", lineHeight: 1, opacity: 0.7 }}>❦</div>
                <p className="pullquote" style={{ margin: 0, fontSize: 18, lineHeight: 1.4 }}>"{card.q}"</p>
                <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border-soft)" }}>
                  <div className="caption" style={{ fontSize: 11, color: "var(--fg)" }}>— {card.a}</div>
                  <div className="mono" style={{ fontSize: 9, marginTop: 4 }}>{card.t}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: -4 }}>
                  <button style={{ width: 28, height: 28, borderRadius: 999, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--fg-muted)", cursor: "pointer" }}><Icon.share/></button>
                  <button style={{ width: 28, height: 28, borderRadius: 999, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--fg-muted)", cursor: "pointer" }}><Icon.close/></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

window.WebTonight = WebTonight;
window.WebMoods = WebMoods;
window.WebReader = WebReader;
window.WebWriter = WebWriter;
window.WebShelf = WebShelf;

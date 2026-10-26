/* global React, Avatar, Btn, Icon, ArticleCard, TabBar, Placeholder, PIECES */

// =================== SCREEN: CREATOR PROFILE (Ines's notebook) ===================
function ScreenProfile({ onBack, onPatron }) {
  const [tab, setTab] = React.useState("letters");
  const writerPieces = PIECES.slice(0, 4);
  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", paddingBottom: 100 }}>
      {/* Status bar */}
      <div style={{ height: 52, paddingTop: 16, paddingLeft: 28, paddingRight: 28,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, color: "var(--fg-strong)" }}>
        <span>9:41</span>
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <span style={{ display: "flex", gap: 2 }}>
            {[3,5,7,9].map(h => <span key={h} style={{ width: 3, height: h, background: "var(--fg-strong)", borderRadius: 1 }}/>)}
          </span>
          <span style={{ width: 24, height: 11, border: "1px solid var(--fg-strong)", borderRadius: 3, padding: 1 }}>
            <span style={{ display: "block", width: "75%", height: "100%", background: "var(--fg-strong)", borderRadius: 1 }}/>
          </span>
        </span>
      </div>
      <div style={{ padding: "8px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "none", border: 0, color: "var(--fg)", cursor: "pointer", padding: 6 }}>
          <Icon.back/>
        </button>
        <button style={{ background: "none", border: 0, color: "var(--fg)", cursor: "pointer", padding: 6 }}><Icon.more/></button>
      </div>

      {/* Hero — pen name forward, no follower counts */}
      <header style={{ padding: "16px 28px 28px", textAlign: "center" }}>
        <Avatar name="Ines" hue={25} size={72}/>
        <h1 className="title-display" style={{
          margin: "16px 0 6px", fontSize: 40, lineHeight: 1.05, letterSpacing: "-0.025em",
        }}>
          Ines <span className="italic-display" style={{ color: "var(--accent)" }}>Marlowe</span>
        </h1>
        <p className="caption" style={{ color: "var(--fg-faint)" }}>a pen name · writes from somewhere coastal</p>

        <p className="body-reading" style={{
          marginTop: 18, fontSize: 16, lineHeight: 1.55,
          maxWidth: "32ch", marginInline: "auto",
          color: "var(--fg-muted)",
          fontStyle: "italic",
        }}>
          "I write letters to people I have not met yet. Some of them are leaving. Some of them are staying. All of them are tender."
        </p>

        <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="primary" size="md" icon={<Icon.candle/>} onClick={onPatron}>Become a patron</Btn>
          <Btn variant="outline" size="md">Subscribe free</Btn>
        </div>

        <div style={{
          marginTop: 24, display: "flex", justifyContent: "center", gap: 28,
          paddingTop: 22, borderTop: "1px solid var(--border-soft)",
        }}>
          <div>
            <div className="mono-num" style={{ fontSize: 18, color: "var(--fg)" }}>34</div>
            <div className="caption" style={{ fontSize: 10 }}>LETTERS</div>
          </div>
          <div>
            <div className="mono-num" style={{ fontSize: 18, color: "var(--fg)" }}>3 yrs</div>
            <div className="caption" style={{ fontSize: 10 }}>WRITING HERE</div>
          </div>
          <div>
            <div className="mono-num" style={{ fontSize: 18, color: "var(--accent)" }}>♡</div>
            <div className="caption" style={{ fontSize: 10 }}>SMALL CIRCLE</div>
          </div>
        </div>
      </header>

      {/* Series — like personal notebooks */}
      <div style={{ padding: "0 24px" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>NOTEBOOKS</div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto" }} className="no-scrollbar">
          {[
            { title: "Letters from a leaving city", count: 8, color: "var(--mood-melancholy)" },
            { title: "On loving slowly", count: 12, color: "var(--mood-tender)" },
            { title: "Sleepless April", count: 6, color: "var(--mood-restless)" },
          ].map(n => (
            <div key={n.title} style={{
              minWidth: 200, padding: 18,
              background: "var(--bg-card)",
              border: "1px solid var(--border-soft)",
              borderRadius: "var(--r-lg)",
              borderLeft: `3px solid ${n.color}`,
            }}>
              <div className="mono" style={{ fontSize: 9, color: "var(--fg-faint)", marginBottom: 8 }}>{n.count} LETTERS</div>
              <div className="title-sm" style={{ fontSize: 16, lineHeight: 1.25 }}>{n.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        marginTop: 28, padding: "0 24px",
        borderBottom: "1px solid var(--border-soft)",
        display: "flex", gap: 24,
      }}>
        {["letters", "patrons-only", "about"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "12px 0", background: "none", border: 0, cursor: "pointer",
            color: tab === t ? "var(--fg)" : "var(--fg-faint)",
            borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
            fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
            textTransform: "capitalize", letterSpacing: "0.02em",
          }}>
            {t === "patrons-only" ? "Patrons only" : t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 24px" }}>
        {writerPieces.map(p => <ArticleCard key={p.id} piece={{ ...p, author: "Ines Marlowe", hue: 25 }}/>)}
      </div>

      <TabBar active="me"/>
    </div>
  );
}

// =================== SCREEN: SHELF (saved + read) ===================
function ScreenShelf() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", paddingBottom: 100 }}>
      <div style={{ height: 52, paddingTop: 16, paddingLeft: 28, paddingRight: 28,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, color: "var(--fg-strong)" }}>
        <span>9:41</span>
      </div>
      <header style={{ padding: "12px 24px 24px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR SHELF</div>
        <h1 className="title-display" style={{ margin: 0, fontSize: 36, lineHeight: 1.05 }}>
          The pieces you<br/><span className="italic-display">held onto.</span>
        </h1>
      </header>

      <div style={{ padding: "0 24px" }}>
        {/* Highlights */}
        <div className="eyebrow" style={{ marginBottom: 14 }}>HIGHLIGHTS · 7 SAVED</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { quote: "We do not leave cities, I think. They unfasten from us, slowly, the way a coat slips off a chair.", from: "On the small grief of leaving a city", author: "Ines Marlowe" },
            { quote: "Some people leave to find themselves; some find themselves by refusing to.", from: "A letter to the version of me who stayed", author: "Tomás Vega" },
          ].map((h, i) => (
            <div key={i} style={{
              padding: 18, background: "var(--bg-card)",
              borderRadius: "var(--r-lg)", borderLeft: "2px solid var(--accent)",
              border: "1px solid var(--border-soft)",
            }}>
              <p className="pullquote" style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>
                "{h.quote}"
              </p>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="caption">from <em>{h.from}</em></div>
                <div className="mono" style={{ fontSize: 9 }}>SAVE AS CARD</div>
              </div>
            </div>
          ))}
        </div>

        <div className="eyebrow" style={{ marginTop: 32, marginBottom: 14 }}>KEPT TO READ AGAIN</div>
        {PIECES.slice(0, 3).map(p => <ArticleCard key={p.id} piece={p}/>)}
      </div>
      <TabBar active="shelf"/>
    </div>
  );
}

window.ScreenProfile = ScreenProfile;
window.ScreenShelf = ScreenShelf;

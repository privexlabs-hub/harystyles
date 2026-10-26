/* global React, Avatar, Btn, Icon, MoodPill, ArticleCard, TabBar, Placeholder */

// =================== SAMPLE DATA ===================
const PIECES = [
  {
    id: "p1",
    title: "On the small grief of leaving a city",
    author: "Ines Marlowe",
    hue: 25,
    date: "March 14",
    readTime: 7,
    mood: "MELANCHOLY",
    excerpt: "I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me.",
    hearts: 412,
    premium: false,
  },
  {
    id: "p2",
    title: "A letter to the version of me who stayed",
    author: "Tomás Vega",
    hue: 280,
    date: "March 12",
    readTime: 12,
    mood: "TENDER",
    excerpt: "You are not weaker for having stayed. Some people leave to find themselves; some find themselves by refusing to.",
    hearts: 1208,
    premium: true,
  },
  {
    id: "p3",
    title: "Notes from a sleepless April",
    author: "Saoirse Linn",
    hue: 200,
    date: "March 10",
    readTime: 5,
    mood: "RESTLESS",
    excerpt: "The 4 a.m. honesty is dangerous because it is real. I write it down anyway.",
    hearts: 893,
    premium: false,
  },
  {
    id: "p4",
    title: "What the river kept",
    author: "Daniyar Khan",
    hue: 160,
    date: "March 8",
    readTime: 9,
    mood: "STILL",
    excerpt: "My grandmother told me the river forgets nothing. I did not understand her then.",
    hearts: 2104,
    premium: true,
  },
  {
    id: "p5",
    title: "Loving someone who is leaving",
    author: "Marisol Cruz",
    hue: 10,
    date: "March 6",
    readTime: 6,
    mood: "BURNING",
    excerpt: "There is a tenderness in the way we hold things we are losing. I learn it again every spring.",
    hearts: 1567,
    premium: false,
  },
];

const MOODS = [
  { id: "tender", label: "Tender", color: "var(--mood-tender)" },
  { id: "restless", label: "Restless", color: "var(--mood-restless)" },
  { id: "melancholy", label: "Melancholy", color: "var(--mood-melancholy)" },
  { id: "still", label: "Still", color: "var(--mood-still)" },
  { id: "burning", label: "Burning", color: "var(--mood-burning)" },
  { id: "untethered", label: "Untethered", color: "var(--mood-untethered)" },
];
window.PIECES = PIECES;
window.MOODS = MOODS;

// =================== STATUS BAR (matches IOSFrame look) ===================
function StatusFiller() {
  return (
    <div style={{
      height: 52, paddingTop: 16, paddingLeft: 28, paddingRight: 28,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600,
      color: "var(--fg-strong)",
    }}>
      <span>9:41</span>
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <span style={{ display: "flex", gap: 2 }}>
          {[3,5,7,9].map(h => <span key={h} style={{ width: 3, height: h, background: "var(--fg-strong)", borderRadius: 1 }}/>)}
        </span>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 1.5C5.7 1.5 3.6 2.4 2 3.9l1.4 1.4C4.6 4.2 6.2 3.5 8 3.5s3.4 0.7 4.6 1.8L14 3.9C12.4 2.4 10.3 1.5 8 1.5zM8 5.5c-1.4 0-2.7 0.5-3.7 1.4L5.7 8.3C6.3 7.8 7.1 7.5 8 7.5s1.7 0.3 2.3 0.8l1.4-1.4C10.7 6 9.4 5.5 8 5.5zM8 9.5l1.5 1.5h-3z"/></svg>
        <span style={{
          width: 24, height: 11, border: "1px solid var(--fg-strong)", borderRadius: 3,
          padding: 1, position: "relative",
        }}>
          <span style={{ display: "block", width: "75%", height: "100%", background: "var(--fg-strong)", borderRadius: 1 }}/>
        </span>
      </span>
    </div>
  );
}

// =================== SCREEN: TONIGHT (home/feed) ===================
function ScreenTonight({ onOpen }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", paddingBottom: 100 }}>
      <StatusFiller/>
      {/* Lamp ribbon */}
      <div style={{ padding: "8px 24px 0" }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", boxShadow: "var(--shadow-glow)" }}/>
          THE LAMP IS LIT · 9:41 PM
        </div>
      </div>
      <header style={{ padding: "12px 24px 18px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR EVENING · MARCH 14</div>
        <h1 className="title-display" style={{ margin: 0, fontSize: 40, lineHeight: 1.05 }}>
          Five pieces<br/><span className="italic-display" style={{ color: "var(--accent)" }}>for tonight.</span>
        </h1>
        <p className="body-ui" style={{ marginTop: 14, color: "var(--fg-muted)", maxWidth: "32ch" }}>
          When you finish them, the app will close. The next ration arrives at sunset tomorrow.
        </p>
      </header>

      <div style={{ padding: "0 24px" }}>
        {PIECES.map(p => <ArticleCard key={p.id} piece={p} onOpen={() => onOpen?.(p)}/>)}
        <div style={{
          marginTop: 28, padding: "28px 20px", textAlign: "center",
          borderTop: "1px solid var(--border-soft)",
        }}>
          <div className="italic-display title-md" style={{ color: "var(--fg-muted)" }}>
            That's all for tonight.
          </div>
          <p className="caption" style={{ marginTop: 8 }}>The lamp will be lit again at sunset.</p>
        </div>
      </div>

      <TabBar active="home"/>
    </div>
  );
}

// =================== SCREEN: MOOD PICKER ===================
function ScreenMoods({ onSelect }) {
  const [selected, setSelected] = React.useState("melancholy");
  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", paddingBottom: 100 }}>
      <StatusFiller/>
      <header style={{ padding: "20px 24px 28px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>READ BY FEELING</div>
        <h1 className="title-display" style={{ margin: 0, fontSize: 36, lineHeight: 1.05 }}>
          How are you,<br/><span className="italic-display">tonight?</span>
        </h1>
      </header>

      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MOODS.map(m => (
            <button key={m.id} onClick={() => setSelected(m.id)} style={{
              padding: "18px 20px",
              background: selected === m.id ? `color-mix(in oklch, ${m.color} 14%, var(--bg-card))` : "var(--bg-card)",
              border: `1px solid ${selected === m.id ? m.color : "var(--border-soft)"}`,
              borderRadius: "var(--r-lg)",
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", textAlign: "left",
              transition: "all var(--dur-2) var(--ease-out)",
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 999, background: m.color,
                opacity: selected === m.id ? 1 : 0.55,
                boxShadow: selected === m.id ? `0 0 24px ${m.color}` : "none",
                transition: "all var(--dur-2) var(--ease-out)",
              }}/>
              <div style={{ flex: 1 }}>
                <div className="title-sm" style={{ color: selected === m.id ? m.color : "var(--fg)" }}>{m.label}</div>
                <div className="caption" style={{ marginTop: 2 }}>
                  {m.id === "tender" && "soft, ached, gentle"}
                  {m.id === "restless" && "the kind that won't sit"}
                  {m.id === "melancholy" && "blue, low-lit, beautiful"}
                  {m.id === "still" && "quiet, even, observed"}
                  {m.id === "burning" && "alive, vivid, urgent"}
                  {m.id === "untethered" && "drifting, unanchored, light"}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Btn variant="primary" size="lg" full iconRight={<Icon.arrowRight/>} onClick={onSelect}>
            Read for {MOODS.find(m => m.id === selected)?.label.toLowerCase()}
          </Btn>
          <p className="caption" style={{ textAlign: "center", marginTop: 14 }}>
            Seven pieces, hand-picked. No infinite list.
          </p>
        </div>
      </div>

      <TabBar active="discover"/>
    </div>
  );
}

// =================== SCREEN: ARTICLE READER ===================
function ScreenReader({ piece = PIECES[0], onBack, onPaywall }) {
  const [highlight, setHighlight] = React.useState(false);
  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", paddingBottom: 80 }}>
      <StatusFiller/>
      {/* Top chrome */}
      <div style={{
        padding: "8px 18px 8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={onBack} style={{ background: "none", border: 0, color: "var(--fg)", cursor: "pointer", padding: 6 }}>
          <Icon.back/>
        </button>
        <div className="mono" style={{ fontSize: 9, color: "var(--fg-faint)" }}>
          {piece.readTime} MIN · MELANCHOLY
        </div>
        <button style={{ background: "none", border: 0, color: "var(--fg)", cursor: "pointer", padding: 6 }}><Icon.more/></button>
      </div>

      {/* Article body */}
      <article style={{ padding: "28px 28px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>ESSAY</div>
        <h1 className="title-display" style={{
          margin: 0, fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.025em",
          fontWeight: 400,
        }}>{piece.title}</h1>
        <p className="italic-display" style={{
          marginTop: 14, fontSize: 18, color: "var(--fg-muted)", fontStyle: "italic",
        }}>A small inventory of what was left behind, and what came along by mistake.</p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, paddingBottom: 22, borderBottom: "1px solid var(--border-soft)" }}>
          <Avatar name={piece.author} hue={piece.hue} size={36}/>
          <div style={{ flex: 1 }}>
            <div className="body-sm" style={{ color: "var(--fg)", fontWeight: 500 }}>{piece.author}</div>
            <div className="caption">3 letters this month · 412 patrons</div>
          </div>
          <Btn size="sm" variant="outline">Follow</Btn>
        </div>

        <p className="body-reading dropcap" style={{ marginTop: 28 }}>
          I packed the kettle last. It seemed important — the last warm thing in the apartment that had ever held me. The radiator had been broken since November, and for four months I had boiled water just to feel something hot in the kitchen, just to make the windows fog.
        </p>
        <p className="body-reading">
          The boxes had agreed-upon names: <em>books</em>, <em>winter</em>, <em>kitchen</em>, <em>misc</em>. The last one swelled with the things that did not deserve a category. A single earring whose pair I had been mourning for two years. The receipt from a restaurant where I had been told something I would not let myself forget. A magnet shaped like a fish.
        </p>

        {/* Pull quote */}
        <blockquote style={{
          margin: "32px -8px",
          padding: "0 24px",
          borderLeft: "2px solid var(--accent)",
        }}>
          <p className="pullquote" style={{ margin: 0 }}>
            We do not leave cities, I think. They unfasten from us, slowly, the way a coat slips off a chair.
          </p>
        </blockquote>

        <p className="body-reading" style={{ position: "relative" }}>
          <span style={{
            background: highlight ? "color-mix(in oklch, var(--accent) 28%, transparent)" : "transparent",
            transition: "background var(--dur-2)",
            cursor: "pointer", padding: "1px 0",
          }} onClick={() => setHighlight(!highlight)}>
            The grief of leaving a place is not the grief of a person. It does not require permission, or warning, or the dignity of being said aloud.
          </span>
          {" "}You can pack it into a box marked <em>misc</em> and discover it three years later, in another city, when you reach for a kettle that is not yours.
        </p>

        {/* Sentence reaction toolbar (appears on highlight) */}
        {highlight && (
          <div style={{
            margin: "12px 0 24px",
            padding: 10,
            background: "var(--bg-elevated)",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--border)",
            display: "flex", gap: 6, alignItems: "center",
            width: "fit-content",
          }}>
            {["❦", "♡", "✦", "◐"].map(s => (
              <button key={s} style={{
                width: 36, height: 36, borderRadius: 999, border: 0,
                background: "transparent", color: "var(--fg)",
                fontSize: 16, cursor: "pointer",
                fontFamily: "var(--font-display)",
              }}>{s}</button>
            ))}
            <div style={{ width: 1, height: 20, background: "var(--border)" }}/>
            <button style={{
              width: 36, height: 36, borderRadius: 999, border: 0,
              background: "transparent", color: "var(--fg-muted)", cursor: "pointer",
              display: "grid", placeItems: "center",
            }}><Icon.reply/></button>
          </div>
        )}

        {/* Soft paywall fade */}
        <div style={{ position: "relative", marginTop: 12 }}>
          <p className="body-reading" style={{ filter: "blur(3px)", opacity: 0.4, userSelect: "none" }}>
            For the rest of this letter, I want to tell you about the morning I came back to find the apartment empty — and what it taught me about the shape of belonging.
          </p>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, transparent 0%, var(--bg) 80%)",
            pointerEvents: "none",
          }}/>
        </div>

        <div style={{
          marginTop: 32, padding: 24,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          textAlign: "center",
        }}>
          <Icon.candle style={{ color: "var(--accent)", margin: "0 auto" }}/>
          <h3 className="title-sm" style={{ margin: "10px 0 6px" }}>Become a patron of Ines.</h3>
          <p className="body-sm" style={{ margin: 0, marginBottom: 16, maxWidth: "32ch", marginInline: "auto" }}>
            Read every letter. Receive one private piece each month, written for patrons.
          </p>
          <Btn variant="premium" size="md" onClick={onPaywall} full>
            $4 / month · support Ines
          </Btn>
          <p className="caption" style={{ marginTop: 12, fontSize: 11 }}>
            Cancel any time. 90% goes to the writer.
          </p>
        </div>
      </article>
    </div>
  );
}

// =================== SCREEN: PATRONAGE MODAL ===================
function ScreenPatron({ onClose }) {
  return (
    <div style={{
      background: "var(--bg)", minHeight: "100%", paddingBottom: 40,
      position: "relative",
    }}>
      <StatusFiller/>
      <button onClick={onClose} style={{
        position: "absolute", top: 56, right: 18, zIndex: 2,
        width: 36, height: 36, borderRadius: 999,
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        color: "var(--fg)", cursor: "pointer",
        display: "grid", placeItems: "center",
      }}><Icon.close/></button>

      <div style={{ padding: "20px 28px 0", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 999, margin: "20px auto 24px",
          background: "radial-gradient(circle, var(--amber-500) 0%, var(--amber-700) 70%)",
          display: "grid", placeItems: "center", color: "var(--ink-50)",
          boxShadow: "var(--shadow-glow), 0 0 60px oklch(0.66 0.15 45 / 0.3)",
        }}>
          <Icon.candle style={{ width: 28, height: 28 }}/>
        </div>
        <div className="eyebrow" style={{ marginBottom: 10, color: "var(--accent)" }}>BECOME A PATRON</div>
        <h1 className="title-display" style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>
          Keep the lamp <span className="italic-display">lit</span><br/>for Ines Marlowe.
        </h1>
        <p className="body-ui" style={{ marginTop: 14, color: "var(--fg-muted)", maxWidth: "30ch", marginInline: "auto" }}>
          Patronage is not a subscription. It is a quiet vote of confidence in someone's voice.
        </p>
      </div>

      <div style={{ padding: "32px 24px 0" }}>
        {/* Tier card */}
        <div style={{
          padding: 24, borderRadius: "var(--r-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--accent)",
          boxShadow: "var(--shadow-glow)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="title-sm">Reader</div>
            <div className="title-md" style={{ color: "var(--accent)" }}>$4<span className="caption" style={{ color: "var(--fg-faint)" }}> /month</span></div>
          </div>
          <div className="divider" style={{ margin: "16px 0" }}/>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Every letter Ines writes — including the ones for patrons",
              "One private piece per month, posted to your Letters",
              "A handwritten note on your first month",
              "Annual reply from Ines, if you write one"
            ].map(t => (
              <li key={t} className="body-sm" style={{ display: "flex", gap: 10, color: "var(--fg)" }}>
                <span className="quill" style={{ width: 0 }}/>
                <span style={{ flex: 1 }}>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 18, padding: 18, borderRadius: "var(--r-lg)", border: "1px dashed var(--border)" }}>
          <div className="caption" style={{ color: "var(--fg)" }}>One-time gift</div>
          <p className="body-sm" style={{ margin: "4px 0 12px" }}>Not ready for monthly? Send Ines a one-time tip.</p>
          <div style={{ display: "flex", gap: 8 }}>
            {["$3", "$7", "$15", "Other"].map(v => (
              <button key={v} style={{
                flex: 1, height: 40, borderRadius: 999,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--fg)", cursor: "pointer",
                fontFamily: "var(--font-ui)", fontSize: 13,
              }}>{v}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <Btn variant="primary" size="lg" full iconRight={<Icon.arrowRight/>}>
            Become a patron · $4/mo
          </Btn>
          <p className="caption" style={{ textAlign: "center", marginTop: 14, fontSize: 11 }}>
            90% goes directly to Ines · cancel any time · no algorithms ever
          </p>
        </div>
      </div>
    </div>
  );
}

window.ScreenTonight = ScreenTonight;
window.ScreenMoods = ScreenMoods;
window.ScreenReader = ScreenReader;
window.ScreenPatron = ScreenPatron;

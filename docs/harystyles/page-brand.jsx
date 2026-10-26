/* global React */

// =============================================================
// HARYSTYLES — DESIGN SYSTEM PAGES
// brand · type · color · spacing · components
// =============================================================

// ----- Logo wordmark + lockups -----
function HSLogomark({ size = 48, color = "var(--accent)" }) {
  // Abstract: an "h" rendered as a candle + flame
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M16 36V12" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M16 24Q24 18 24 28T32 36" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M32 12Q34 9 32 6Q30 9 32 12Z" fill={color}/>
      <circle cx="32" cy="14" r="1.4" fill="var(--bg)"/>
    </svg>
  );
}
window.HSLogomark = HSLogomark;

function HSWordmark({ size = 36, color = "var(--fg-strong)" }) {
  return (
    <span style={{
      fontFamily: "var(--font-display)",
      fontWeight: 400, fontSize: size, lineHeight: 1,
      letterSpacing: "-0.035em",
      fontVariationSettings: '"opsz" 144, "SOFT" 50',
      color,
    }}>harystyles<span style={{ color: "var(--accent)" }}>.</span></span>
  );
}
window.HSWordmark = HSWordmark;

// =============================================================
// BRAND PAGE
// =============================================================
function PageBrand() {
  const Sample = ({ children, label }) => (
    <div style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
      <div className="mono" style={{ fontSize: 9, marginBottom: 14 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", padding: 56, minHeight: "100%" }}>
      <div className="eyebrow">01 · BRAND</div>
      <h1 className="title-display" style={{ margin: "8px 0 24px", fontSize: 56, lineHeight: 1.0 }}>
        The lamp, the letter, the <span className="italic-display" style={{ color: "var(--accent)" }}>quiet voice.</span>
      </h1>
      <p className="body-reading" style={{ maxWidth: "60ch", color: "var(--fg-muted)", marginBottom: 48 }}>
        harystyles is a place for emotional long-form writing. The brand reads as a literary publication that happens to be digital — not a tech product that happens to publish writing.
      </p>

      {/* Logo */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>LOGO + LOCKUPS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
        <Sample label="PRIMARY · WORDMARK">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <HSLogomark size={48}/>
            <HSWordmark size={42}/>
          </div>
        </Sample>
        <Sample label="MARK ONLY · APP ICON">
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, background: "var(--ink-1000)", borderRadius: 14, display: "grid", placeItems: "center", border: "1px solid var(--border)" }}>
              <HSLogomark size={36}/>
            </div>
            <div style={{ width: 64, height: 64, background: "var(--accent)", borderRadius: 14, display: "grid", placeItems: "center" }}>
              <HSLogomark size={36} color="var(--ink-1000)"/>
            </div>
            <div style={{ width: 64, height: 64, background: "var(--ink-100)", borderRadius: 14, display: "grid", placeItems: "center" }}>
              <HSLogomark size={36} color="var(--ink-1000)"/>
            </div>
          </div>
        </Sample>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 48 }}>
        <Sample label="TAGLINE LOCKUP">
          <HSWordmark size={28}/>
          <div className="mono" style={{ marginTop: 10, fontSize: 11, color: "var(--accent)" }}>LETTERS, NOT POSTS</div>
        </Sample>
        <Sample label="SMALL · UI">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HSLogomark size={20}/>
            <HSWordmark size={18}/>
          </div>
        </Sample>
        <Sample label="STAMP">
          <div style={{ width: 80, height: 80, borderRadius: 999, border: "1.5px solid var(--accent)", display: "grid", placeItems: "center", margin: "0 auto" }}>
            <HSLogomark size={32}/>
          </div>
        </Sample>
      </div>

      {/* Voice */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>VOICE & TONE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 48 }}>
        {[
          { t: "Quiet, not loud", d: "Lowercase ‘harystyles’. Sentence case everywhere. We never shout — and we never use marketing-speak like ‘unlock’, ‘join the community’, or ‘exclusive’." },
          { t: "Literary, not technical", d: "Letters, not posts. Patrons, not subscribers. Notebooks, not collections. Shelf, not library. The lamp is lit, not ‘5 unread items’." },
          { t: "Tender, not breezy", d: "We can be sad. We can be slow. We can use a semicolon. We trust readers with long sentences and quiet pauses." },
          { t: "Specific, never generic", d: "Replace ‘story’ with ‘letter’ or the actual title. Replace ‘creator’ with the writer's name. We name things, including the dark." },
        ].map(c => (
          <div key={c.t} style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
            <div className="title-md" style={{ marginBottom: 8 }}>{c.t}</div>
            <p className="body-sm" style={{ margin: 0 }}>{c.d}</p>
          </div>
        ))}
      </div>

      {/* Do / Don't */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>WORDS WE USE — AND DON'T</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 48 }}>
        <div style={{ padding: 24, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderLeft: "3px solid var(--mood-still)" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--mood-still)", marginBottom: 12 }}>WE SAY</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {["letter · piece · essay","writer · author","patron · reader","notebook · series","the lamp is lit","kept · saved a line","tonight, gently"].map(w => (
              <li key={w} className="body-reading" style={{ fontSize: 16 }}>{w}</li>
            ))}
          </ul>
        </div>
        <div style={{ padding: 24, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderLeft: "3px solid var(--mood-burning)" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--mood-burning)", marginBottom: 12 }}>WE DON'T</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {["post · article · content","creator · influencer","subscriber · user","collection · feed","new content available","liked · clapped · bookmarked","trending now"].map(w => (
              <li key={w} className="body-reading" style={{ fontSize: 16, color: "var(--fg-faint)", textDecoration: "line-through" }}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Iconography */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>ICONOGRAPHY · 1.6PX STROKE · ROUNDED CAPS</div>
      <p className="body-sm" style={{ marginBottom: 18, maxWidth: "60ch" }}>
        Hairline icons inspired by editorial bookmark glyphs. We avoid filled UI icons except as toggle-on states. Reactions use typographic glyphs (❦ ♡ ✦ ◐) drawn from the display serif rather than icons — they belong to the letter, not the chrome.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 16, marginBottom: 24, padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
        {[
          ["candle", window.Icon.candle],
          ["letter", window.Icon.letter],
          ["feather", window.Icon.feather],
          ["bookmark", window.Icon.bookmark],
          ["heart", window.Icon.heart],
          ["highlight", window.Icon.highlight],
          ["reply", window.Icon.reply],
          ["search", window.Icon.search],
          ["share", window.Icon.share],
          ["lock", window.Icon.lock],
          ["moon", window.Icon.moon],
          ["pencil", window.Icon.pencil],
          ["user", window.Icon.user],
          ["plus", window.Icon.plus],
          ["arrow", window.Icon.arrowRight],
          ["close", window.Icon.close],
        ].map(([n, I]) => (
          <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--fg)" }}>
            <I/>
            <div className="mono" style={{ fontSize: 9 }}>{n}</div>
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 16 }}>REACTION GLYPHS · DRAWN FROM THE SERIF</div>
      <div style={{ display: "flex", gap: 18, padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
        {[
          ["❦","kept"],
          ["♡","tender"],
          ["✦","spark"],
          ["◐","staying"],
          ["—","held"],
        ].map(([g, l]) => (
          <div key={l} style={{ flex: 1, textAlign: "center" }}>
            <div className="title-display" style={{ fontSize: 48, color: "var(--accent)", lineHeight: 1 }}>{g}</div>
            <div className="caption" style={{ marginTop: 8 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.PageBrand = PageBrand;

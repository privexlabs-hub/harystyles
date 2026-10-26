/* global React */

// =============================================================
// SPACING / RADII / SHADOWS / MOTION
// =============================================================
function PageSpacing() {
  const SPACES = [
    ["--s-1", 4], ["--s-2", 8], ["--s-3", 12], ["--s-4", 16], ["--s-5", 24],
    ["--s-6", 32], ["--s-7", 40], ["--s-8", 48], ["--s-9", 64], ["--s-10", 80], ["--s-11", 96],
  ];
  const RADII = [
    ["--r-xs", 3], ["--r-sm", 6], ["--r-md", 10], ["--r-lg", 14], ["--r-xl", 20], ["--r-2xl", 28], ["--r-pill", 999],
  ];
  return (
    <div style={{ background: "var(--bg)", padding: 56, minHeight: "100%" }}>
      <div className="eyebrow">04 · SPACING · RADII · SHADOWS · MOTION</div>
      <h1 className="title-display" style={{ margin: "8px 0 32px", fontSize: 56, lineHeight: 1.0 }}>
        Quiet rules for <span className="italic-display" style={{ color: "var(--accent)" }}>generous space.</span>
      </h1>

      {/* Spacing scale */}
      <div className="eyebrow" style={{ marginBottom: 18 }}>SPACING · 4PX BASE</div>
      <div style={{ padding: 28, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14, marginBottom: 40 }}>
        {SPACES.map(([t, px]) => (
          <div key={t} style={{ display: "grid", gridTemplateColumns: "120px 80px 1fr", alignItems: "center", padding: "8px 0" }}>
            <div className="mono" style={{ fontSize: 10 }}>{t}</div>
            <div className="caption">{px}px</div>
            <div style={{ height: 16, width: px, background: "var(--accent)", borderRadius: 2 }}/>
          </div>
        ))}
      </div>

      {/* Radii */}
      <div className="eyebrow" style={{ marginBottom: 18 }}>RADII</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 14, marginBottom: 40 }}>
        {RADII.map(([t, r]) => (
          <div key={t}>
            <div style={{
              height: 80, background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: r, display: "grid", placeItems: "center", color: "var(--fg-muted)",
              fontFamily: "var(--font-mono)", fontSize: 11,
            }}>{r === 999 ? "pill" : `${r}`}</div>
            <div className="mono" style={{ fontSize: 9, marginTop: 6 }}>{t}</div>
          </div>
        ))}
      </div>

      {/* Shadows */}
      <div className="eyebrow" style={{ marginBottom: 18 }}>SHADOWS · WARM-VIOLET TINT</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18, marginBottom: 40 }}>
        {["xs","sm","md","lg","glow"].map(s => (
          <div key={s} style={{
            height: 120, background: "var(--bg-card)", borderRadius: 14,
            boxShadow: s === "glow" ? "var(--shadow-glow)" : `var(--shadow-${s})`,
            display: "grid", placeItems: "center",
            border: s === "glow" ? "1px solid var(--accent)" : "1px solid var(--border-soft)",
          }}>
            <div className="mono" style={{ fontSize: 10 }}>--shadow-{s}</div>
          </div>
        ))}
      </div>

      {/* Motion */}
      <div className="eyebrow" style={{ marginBottom: 18 }}>MOTION · UNHURRIED</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 40 }}>
        {[
          { t: "--dur-1", v: "120ms", note: "press / micro" },
          { t: "--dur-2", v: "220ms", note: "default state change" },
          { t: "--dur-3", v: "360ms", note: "modal / sheet" },
          { t: "--dur-4", v: "600ms", note: "scenic / lamp" },
        ].map(m => (
          <div key={m.t} style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 10 }}>{m.t}</div>
            <div className="title-md" style={{ marginTop: 8, fontSize: 22 }}>{m.v}</div>
            <div className="caption" style={{ marginTop: 4 }}>{m.note}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
        <div className="mono" style={{ fontSize: 10, marginBottom: 10 }}>EASING</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <li className="body-sm" style={{ color: "var(--fg)" }}><strong>--ease-out</strong> · default<br/><span className="mono" style={{ fontSize: 9 }}>cubic-bezier(0.2, 0.7, 0.2, 1)</span></li>
          <li className="body-sm" style={{ color: "var(--fg)" }}><strong>--ease-in-out</strong> · transitions<br/><span className="mono" style={{ fontSize: 9 }}>cubic-bezier(0.45, 0, 0.2, 1)</span></li>
          <li className="body-sm" style={{ color: "var(--fg)" }}><strong>--ease-overshoot</strong> · arrival<br/><span className="mono" style={{ fontSize: 9 }}>cubic-bezier(0.34, 1.4, 0.6, 1)</span></li>
        </ul>
      </div>

      {/* Layout */}
      <div className="eyebrow" style={{ marginTop: 48, marginBottom: 18 }}>READING MEASURE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {[
          ["--measure-narrow", "38ch", "verse, lists, captions"],
          ["--measure", "62ch", "default body — long-form"],
          ["--measure-wide", "72ch", "essays, dense reading"],
        ].map(([t, v, d]) => (
          <div key={t} style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 10 }}>{t}</div>
            <div className="title-md" style={{ marginTop: 6, fontSize: 22 }}>{v}</div>
            <div className="caption" style={{ marginTop: 4 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.PageSpacing = PageSpacing;

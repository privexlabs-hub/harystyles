/* global React */

// =================== ICONS (minimal inline set) ===================
const Icon = {
  bookmark: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  bookmarkFill: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  heart: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  search: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  home: (p) => <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-5h-2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  candle: (p) => <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-1 1.5-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-1-2.5-2-4z"/><rect x="9" y="10" width="6" height="11" rx="1"/></svg>,
  letter: (p) => <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
  feather: (p) => <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>,
  user: (p) => <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  lock: (p) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  arrowRight: (p) => <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back: (p) => <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  more: (p) => <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>,
  close: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  moon: (p) => <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  flame: (p) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 2-4 2-4s-1 6 2 6c2 0 2-2 0-4z"/></svg>,
  pencil: (p) => <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>,
  plus: (p) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  highlight: (p) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l-6 6v4h4l6-6"/><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.83 0L9.4 11.4a2 2 0 0 1 0-2.82L14 4z"/></svg>,
  reply: (p) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
};
window.Icon = Icon;

// =================== AVATAR ===================
function Avatar({ name = "?", size = 40, hue = 45, ring = false }) {
  const initial = name.trim()[0]?.toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `oklch(0.30 0.04 ${hue})`,
      color: `oklch(0.85 0.08 ${hue})`,
      display: "grid", placeItems: "center",
      fontFamily: "var(--font-display)",
      fontSize: size * 0.42, fontWeight: 500,
      boxShadow: ring ? "0 0 0 2px var(--bg), 0 0 0 3px var(--accent)" : "none",
      flexShrink: 0,
    }}>{initial}</div>
  );
}
window.Avatar = Avatar;

// =================== BUTTONS ===================
function Btn({ variant = "primary", size = "md", children, icon, iconRight, onClick, full, style = {} }) {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13, gap: 6 },
    md: { h: 40, px: 16, fs: 14, gap: 8 },
    lg: { h: 48, px: 20, fs: 15, gap: 10 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: "var(--accent)", fg: "var(--accent-fg)", border: "transparent" },
    secondary: { bg: "var(--bg-elevated)", fg: "var(--fg)", border: "var(--border)" },
    ghost: { bg: "transparent", fg: "var(--fg)", border: "transparent" },
    outline: { bg: "transparent", fg: "var(--fg)", border: "var(--border-strong)" },
    premium: { bg: "var(--premium)", fg: "var(--ink-50)", border: "transparent" },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      height: s.h, padding: `0 ${s.px}px`,
      background: v.bg, color: v.fg,
      border: `1px solid ${v.border}`,
      borderRadius: 999,
      fontFamily: "var(--font-ui)", fontSize: s.fs, fontWeight: 500,
      letterSpacing: "0.005em",
      display: "inline-flex", alignItems: "center", gap: s.gap,
      cursor: "pointer", width: full ? "100%" : "auto",
      justifyContent: "center",
      transition: "all var(--dur-2) var(--ease-out)",
      ...style,
    }}>
      {icon}{children}{iconRight}
    </button>
  );
}
window.Btn = Btn;

// =================== ARTICLE CARD (feed) ===================
function ArticleCard({ piece, onOpen }) {
  return (
    <article onClick={onOpen} style={{
      padding: "24px 0",
      borderTop: "1px solid var(--border-soft)",
      cursor: "pointer", display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar name={piece.author} size={20} hue={piece.hue} />
        <span className="caption" style={{ color: "var(--fg-muted)" }}>{piece.author}</span>
        <span className="mono" style={{ color: "var(--fg-faint)" }}>·</span>
        <span className="mono" style={{ fontSize: 10 }}>{piece.date}</span>
        {piece.premium && (
          <span className="mono" style={{
            marginLeft: "auto",
            color: "var(--wine-300)", display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10,
          }}><Icon.lock/>PATRON</span>
        )}
      </div>
      <div>
        <h3 className="title-md" style={{ margin: 0, marginBottom: 6 }}>{piece.title}</h3>
        <p className="body-reading" style={{
          margin: 0, fontSize: "var(--t-base)", lineHeight: 1.55,
          color: "var(--fg-muted)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{piece.excerpt}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 2 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--fg-faint)" }}>{piece.readTime} MIN</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--fg-faint)" }}>{piece.mood}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 14, color: "var(--fg-subtle)" }}>
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 12 }}><Icon.heart/>{piece.hearts}</span>
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 12 }}><Icon.bookmark/></span>
        </div>
      </div>
    </article>
  );
}
window.ArticleCard = ArticleCard;

// =================== MOOD PILL ===================
function MoodPill({ label, color, selected, onClick, size = "md" }) {
  const px = size === "lg" ? "16px 22px" : "10px 16px";
  const fs = size === "lg" ? 15 : 13;
  return (
    <button onClick={onClick} style={{
      padding: px, borderRadius: 999,
      background: selected ? `color-mix(in oklch, ${color} 18%, var(--bg-card))` : "var(--bg-card)",
      border: `1px solid ${selected ? color : "var(--border)"}`,
      color: selected ? color : "var(--fg-muted)",
      fontFamily: "var(--font-ui)", fontSize: fs, fontWeight: 500,
      letterSpacing: "0.005em", cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 8,
      transition: "all var(--dur-2) var(--ease-out)",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block" }}/>
      {label}
    </button>
  );
}
window.MoodPill = MoodPill;

// =================== TAB BAR (mobile) ===================
function TabBar({ active = "home", onChange }) {
  const tabs = [
    { id: "home", label: "Tonight", icon: <Icon.candle/> },
    { id: "discover", label: "Moods", icon: <Icon.search/> },
    { id: "letters", label: "Letters", icon: <Icon.letter/> },
    { id: "shelf", label: "Shelf", icon: <Icon.bookmark/> },
    { id: "me", label: "Me", icon: <Icon.user/> },
  ];
  return (
    <nav style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      height: 78, paddingBottom: 18,
      background: "color-mix(in oklch, var(--bg) 88%, transparent)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid var(--border-soft)",
      display: "flex", justifyContent: "space-around", alignItems: "center",
      zIndex: 10,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange?.(t.id)} style={{
          background: "none", border: 0, cursor: "pointer",
          color: active === t.id ? "var(--accent)" : "var(--fg-faint)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          fontFamily: "var(--font-ui)", fontSize: 10, letterSpacing: "0.04em",
          padding: 6,
        }}>
          {t.icon}
          <span style={{ textTransform: "uppercase", fontWeight: 500 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
window.TabBar = TabBar;

// =================== PLACEHOLDER IMAGE ===================
function Placeholder({ w = "100%", h = 160, label = "image", style }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: "var(--r-md)",
      background: `repeating-linear-gradient(45deg, var(--ink-800) 0 8px, var(--ink-900) 8px 16px)`,
      border: "1px solid var(--border-soft)",
      display: "grid", placeItems: "center",
      ...style,
    }}>
      <span className="mono" style={{ color: "var(--fg-faint)", fontSize: 10 }}>{label}</span>
    </div>
  );
}
window.Placeholder = Placeholder;

import Link from "next/link";
import { BrandLink, Logomark, Wordmark } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

/** WebMarketing (screens-web.jsx). Fully static — prerendered into the shell. */
const FEATURES = [
  { icon: Icon.candle, title: "A daily ration of five", body: "Five letters each evening, picked by people, not a feed. When you finish them, the lamp goes out until tomorrow's sunset." },
  { icon: Icon.moon, title: "Read by feeling", body: "Tender, restless, melancholy, still, burning, untethered. Choose how the evening feels and the letters follow." },
  { icon: Icon.letter, title: "Patronage, not paywall", body: "Support a writer you love for $4 a month. 90% goes to them. Everyone can read the public letters, always." },
  { icon: Icon.bookmark, title: "Keep the lines that stay", body: "Highlight a sentence and it waits on your shelf. Reactions are private — no likes, no counts, no audience." },
  { icon: Icon.feather, title: "Write in vellum", body: "A quiet editor for long letters. Pen names are welcome; your legal name is never shown." },
  { icon: Icon.pencil, title: "Dark by default", body: "Ink, Dusk, or Paper. Set in Fraunces for reading by lamplight. Toggle to paper whenever you like." },
];

export default function Landing() {
  return (
    <>
      <header className="mx-auto flex h-16 max-w-[1280px] items-center gap-8 px-4 md:px-10">
        <BrandLink />
        <nav aria-label="Site" className="ml-6 hidden gap-7 text-sm text-fg-muted md:flex">
          <Link href="/tonight" className="hover:text-fg">
            Read
          </Link>
          <Link href="/studio/apply" className="hover:text-fg">
            Write
          </Link>
          <Link href="/writers" className="hover:text-fg">
            Writers
          </Link>
        </nav>
        <div className="ml-auto flex gap-3">
          <ButtonLink href="/sign-in" variant="outline" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/tonight" size="sm">
            Begin
          </ButtonLink>
        </div>
      </header>

      <main id="main">
        <section className="mx-auto max-w-[1280px] px-4 pb-24 pt-16 md:px-10 md:pt-28">
          <p className="mono m-0 mb-6 text-accent">A quieter place to read and write</p>
          <h1 className="title-hero m-0 max-w-[12ch]">
            Letters, <span className="italic-display text-accent">not posts.</span>
          </h1>
          <p className="body-reading mb-0 mt-8 max-w-[52ch] text-[19px] text-fg-muted">
            Five letters an evening, chosen by people who read for a living, found by the mood you come home in. No feed. No algorithm. No likes. Just writing that asks to be read slowly.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/tonight" size="lg" icon={<Icon.candle />}>
              Begin reading tonight
            </ButtonLink>
            <ButtonLink href="/studio/apply" size="lg" variant="outline" icon={<Icon.feather />}>
              Write a letter
            </ButtonLink>
          </div>
          <p className="caption mb-0 mt-5">Free to read. $4/mo to support a writer. Cancel any time.</p>
        </section>

        <section className="border-t border-line-soft">
          <div className="mx-auto max-w-[1280px] px-4 py-20 md:px-10">
            <p className="eyebrow m-0 mb-3">How it feels</p>
            <h2 className="title-display m-0 mb-12 max-w-[20ch]">
              Built for the way you actually <span className="italic-display text-accent">want to read.</span>
            </h2>
            <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex flex-col gap-3 rounded-[14px] border border-line-soft bg-bg-raised p-7">
                  <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent">
                    <f.icon />
                  </span>
                  <h3 className="title-sm m-0">{f.title}</h3>
                  <p className="body-sm m-0">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-line-soft">
          <figure className="mx-auto m-0 flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
            <span aria-hidden className="text-3xl text-accent">
              ❦
            </span>
            <blockquote className="pullquote m-0 text-[clamp(1.6rem,3.2vw,2.25rem)] text-fg-strong">“It’s the only place online I read slowly anymore.”</blockquote>
            <figcaption className="caption">— Saoirse L., reader (illustrative)</figcaption>
          </figure>
        </section>

        <section className="border-t border-line-soft">
          <div className="mx-auto max-w-[880px] px-4 py-20 md:px-10">
            <p className="eyebrow m-0 mb-3 text-center">No plans, just people</p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-4 rounded-[18px] border border-line bg-bg-raised p-8">
                <p className="mono m-0">Reading</p>
                <p className="title-display m-0">Free</p>
                <p className="body-sm m-0">Tonight’s five, every mood, every public letter, your private shelf.</p>
                <ButtonLink href="/tonight" variant="outline" full>
                  Begin reading
                </ButtonLink>
              </div>
              <div className="flex flex-col gap-4 rounded-[18px] border border-accent bg-bg-raised p-8 shadow-[var(--shadow-glow)]">
                <p className="mono m-0 text-accent">Patron · per writer</p>
                <p className="title-display m-0">
                  $4<span className="text-lg text-fg-muted">/mo</span>
                </p>
                <p className="body-sm m-0">Every letter a writer sends, including the ones for patrons. 90% goes to them. Opens after the founding beta.</p>
                <ButtonLink href="/writers" full>
                  Find a writer
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-soft">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:px-10">
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-2">
              <Logomark size={28} />
              <Wordmark size={22} />
            </span>
            <p className="mono m-0 text-accent">Letters, not posts</p>
          </div>
          <nav aria-label="Read" className="flex flex-col gap-2 text-sm text-fg-muted">
            <p className="eyebrow m-0 mb-1">Read</p>
            <Link href="/tonight">Tonight</Link>
            <Link href="/moods">Moods</Link>
            <Link href="/writers">Writers</Link>
          </nav>
          <nav aria-label="Write" className="flex flex-col gap-2 text-sm text-fg-muted">
            <p className="eyebrow m-0 mb-1">Write</p>
            <Link href="/studio/apply">Begin a letter</Link>
            <Link href="/studio">Your studio</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

import type { Strings } from '../i18n';
import { directUrl, formatNumber, useSite } from '../site';
import { Ltr, Rich } from '../components/Rich';
import { Words } from '../components/Words';
import { ArrowEnd, Check, CheckCircle, ChevronBack, Clock, Info, Send, UserCheck } from '../components/Icons';

// What the service is and how to use the bot, plus a link to the Instagram account (PRD §7.2).
// Layout, type and motion follow web/DESIGN.md. Mock-ups are HTML illustrations; the real copy is beside them.
export function Home({ t }: { t: Strings }) {
  const site = useSite();
  const h = t.home;

  return (
    <>
      <Hero t={t} />

      <section aria-labelledby="how" className="shell section-gap">
        <div className="grid-12 gap-y-6">
          <p className="t-label lg:col-span-3">{h.how.eyebrow}</p>
          <div className="flex flex-col gap-6 lg:col-span-8">
            <h2 id="how" className="t-section">
              <Words text={h.how.title} />
            </h2>
            <p className="t-lede">
              <Words text={h.how.intro} />
            </p>
          </div>
        </div>

        {/* Pinned story on wide screens with scroll timelines; zig-zag rows otherwise (DESIGN.md §8). */}
        <div className="story mt-16 sm:mt-24">
          <ol className="story-steps">
            {h.how.steps.map((step, i) => (
              <li key={i} className={`story-step story-step-${i + 1} reveal`}>
                <div className="story-copy flex flex-col gap-4">
                  <span className="step-num">{formatNumber(site.locale, i + 1, 2)}</span>
                  <h3 className="text-2xl font-bold text-ink sm:text-4xl">{step.title}</h3>
                  <p className="t-body text-lg">
                    <Rich text={step.body} />
                  </p>
                </div>
                <div aria-hidden="true" className="story-inline step-visual">
                  <StepVisual t={t} i={i} />
                </div>
              </li>
            ))}
          </ol>
          <div aria-hidden="true" className="story-stage">
            <div className="story-rail">
              {h.how.steps.map((_, i) => (
                <span key={i} className={`story-rail-seg story-rail-${i + 1}`} />
              ))}
            </div>
            <div className="story-frames">
              {h.how.steps.map((_, i) => (
                <div key={i} className={`story-frame story-frame-${i + 1}`}>
                  <StepVisual t={t} i={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="sources" className="border-y border-hairline bg-sheet">
        <div className="shell section-gap grid-12 gap-y-12">
          <div className="flex flex-col gap-6 lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
            <p className="t-label">{h.sources.eyebrow}</p>
            <h2 id="sources" className="t-section">
              <Words text={h.sources.title} />
            </h2>
            <p className="t-lede">
              <Words text={h.sources.intro} />
            </p>
          </div>
          <div className="flex flex-col lg:col-span-6 lg:col-start-7">
            {h.sources.items.map((item, i) => (
              <div key={i} className="slide-in flex flex-col gap-5 border-t border-hairline py-10 first:border-t-0 first:pt-0 lg:py-16">
                <span
                  className={
                    i === 0
                      ? 'spin-in flex size-14 items-center justify-center rounded-full bg-mist text-accent'
                      : 'spin-in flex size-14 items-center justify-center rounded-full bg-caution-soft text-caution'
                  }
                >
                  {i === 0 ? <UserCheck className="size-7" /> : <Info className="size-7" />}
                </span>
                <h3 className={i === 0 ? 'text-2xl font-bold text-ink sm:text-3xl' : 'text-2xl font-bold text-caution sm:text-3xl'}>
                  {item.title}
                </h3>
                <p className="t-body text-lg">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="privacy-band" className="py-6">
        <div className="band-open bg-band text-on-band">
          <div className="shell section-gap flex flex-col gap-14">
            <div className="grid-12 gap-y-6">
              <p className="font-mono text-[0.8125rem] font-medium text-on-band-muted lg:col-span-3">{h.privacyBand.eyebrow}</p>
              <h2 id="privacy-band" className="t-section text-on-band lg:col-span-9">
                <Words text={h.privacyBand.title} className="w w-band" />
              </h2>
            </div>
            <ul className="grid-12 gap-y-10">
              {h.privacyBand.facts.map((fact, i) => (
                <li
                  key={fact.value}
                  className={[
                    `fact fact-${i + 1} flex flex-col gap-3 border-t border-on-band/15 pt-6`,
                    ['lg:col-span-5', 'lg:col-span-4', 'lg:col-span-3'][i],
                  ].join(' ')}
                >
                  <span className="fact-value text-[clamp(2.5rem,1.5rem+3vw,4.5rem)] leading-none font-bold text-band-accent">
                    {fact.value}
                  </span>
                  <span className="max-w-xs leading-7 text-on-band-muted">{fact.label}</span>
                </li>
              ))}
            </ul>
            <p className="text-on-band [&_.link]:text-band-accent [&_.link]:decoration-band-accent/40">
              <Rich text={h.privacyBand.link} />
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="final" className="section-gap overflow-hidden">
        <div className="shell">
          <h2 id="final" className="final-slide t-display text-[clamp(3rem,1rem+7vw,8rem)] lg:whitespace-nowrap">
            {h.final.title}
          </h2>
        </div>
        <div className="shell grid-12 mt-10 items-center gap-y-8">
          <p className="t-lede reveal lg:col-span-7">
            <Rich text={h.final.body} />
          </p>
          <div className="reveal lg:col-span-5 lg:justify-self-end">
            <CtaButton t={t} />
          </div>
        </div>
      </section>
    </>
  );
}

function StepVisual({ t, i }: { t: Strings; i: number }) {
  return i === 0 ? <ShareSheet t={t} /> : i === 1 ? <AuthorVisual t={t} /> : <ResultVisual t={t} />;
}

function CtaButton({ t }: { t: Strings }) {
  const site = useSite();
  return (
    <a href={directUrl(site.instagramHandle)} className="btn">
      <span>
        <Rich text={t.home.cta} links={false} />
      </span>
      <ArrowEnd className="btn-arrow" />
    </a>
  );
}

function Hero({ t }: { t: Strings }) {
  const h = t.home;
  // Load cascade: each headline word and capsule gets the next 50ms step (DESIGN.md §8).
  let order = 1;

  return (
    <section className="relative overflow-hidden">
      <div className="shell grid-12 gap-y-14 pt-14 pb-16 sm:pt-20 lg:pt-24">
        <div className="hero-copy flex flex-col items-start gap-8 lg:col-span-8">
          <p className="chip-accent rise">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            {h.eyebrow}
          </p>
          <h1 className="t-display">
            {h.headline.map((seg, i) => {
              const space = i > 0 ? ' ' : '';
              if (typeof seg === 'string' || 'accent' in seg) {
                const text = typeof seg === 'string' ? seg : seg.accent;
                const words = text.split(' ').map((word, j) => (
                  <span key={j}>
                    {j > 0 ? ' ' : ''}
                    <span className={`hw ${heroDelay(order++)}`}>{word}</span>
                  </span>
                ));
                return (
                  <span key={i} className={typeof seg === 'string' ? undefined : 'text-accent'}>
                    {space}
                    {words}
                  </span>
                );
              }
              return (
                <span key={i}>
                  {space}
                  <Capsule kind={seg.capsule} label={h.verdict} delay={heroDelay(order++)} />
                </span>
              );
            })}
          </h1>
          <p className="t-lede rise hd14">
            <Rich text={h.lede} />
          </p>
          <div className="rise hd16 flex flex-wrap items-center gap-x-5 gap-y-3">
            <CtaButton t={t} />
            <span className="text-sm text-pewter">{h.ctaNote}</span>
          </div>
        </div>

        <figure className="hero-phone settle hd12 flex flex-col items-center gap-4 lg:col-span-4 lg:mt-40">
          <Phone t={t} />
          <figcaption className="max-w-[18rem] text-center text-xs leading-6 text-pewter">{h.example.caption}</figcaption>
        </figure>
      </div>

      <div className="shell pb-16">
        <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:gap-6">
          <span className="t-label shrink-0">{h.sendLabel}</span>
          <div className="marquee min-w-0 flex-1">
            <ul className="marquee-track">
              {[...h.sendExamples, ...h.sendExamples].map((ex, i) => (
                <li key={i} aria-hidden={i >= h.sendExamples.length ? 'true' : undefined} className="chip whitespace-nowrap">
                  {ex.startsWith('@') || ex.startsWith('instagram') ? (
                    <bdi dir="ltr" className="font-mono text-[0.8125rem]">
                      {ex}
                    </bdi>
                  ) : (
                    ex
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const heroDelay = (n: number) => `hd${Math.min(n, 16)}`;

// Inline headline visuals (DESIGN.md §4). Decorative: the sentence reads fully without them.
function Capsule({ kind, label, delay }: { kind: 'page' | 'dm' | 'verdict'; label: string; delay: string }) {
  const anim = `pop-in ${delay}`;
  if (kind === 'page')
    return (
      <span aria-hidden="true" className={`capsule capsule-page ${anim}`}>
        <span className="avatar" />
        <bdi dir="ltr" className="handle">
          @sample.shop
        </bdi>
      </span>
    );
  if (kind === 'dm')
    return (
      <span aria-hidden="true" className={`capsule capsule-dm ${anim}`}>
        <span />
        <span />
        <span />
      </span>
    );
  return (
    <span aria-hidden="true" className={`capsule capsule-verdict ${anim}`}>
      <Check className="size-[0.38em]" />
      <span className="label">{label}</span>
    </span>
  );
}

// The Instagram chat, drawn in HTML: the visitor shares a profile, the bot answers.
function Phone({ t }: { t: Strings }) {
  const site = useSite();
  const ex = t.home.example;

  return (
    <div className="phone-par w-full">
    <div className="float w-full">
      <div role="group" aria-label={ex.label} className="phone">
        <div className="phone-screen">
          <div className="flex items-center gap-3 border-b border-hairline bg-sheet px-4 pt-5 pb-3">
            <ChevronBack className="size-5 text-pewter rtl:-scale-x-100" />
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-solid text-on-accent">
              <Check className="size-4.5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-ink">{t.brand}</span>
              <span className="font-mono text-xs text-pewter" dir="ltr">
                @{site.instagramHandle}
              </span>
            </span>
          </div>

          <div className="flex min-h-[25rem] flex-col gap-3 px-3.5 py-4">
            <span className="self-center rounded-full bg-wash px-3 py-0.5 text-[0.7rem] font-medium text-pewter">
              {ex.today}
            </span>
            <div className="bubble-out settle b1 self-end">
              <span className="flex items-center gap-3 rounded-[1.1rem] bg-on-accent/10 p-2.5 pe-4">
                <span className="size-9 shrink-0 rounded-full bg-on-accent/30" />
                <span className="flex flex-col leading-tight">
                  <bdi dir="ltr" className="font-mono text-[0.8125rem] font-semibold">
                    {ex.shared}
                  </bdi>
                  <span className="text-xs opacity-85">{ex.sharedKind}</span>
                </span>
              </span>
            </div>
            <p className="bubble-in settle b2 self-start">{ex.checking}</p>
            <div className="bubble-in settle b3 self-start">
              {ex.reply.map((line, i) => (
                <p
                  key={i}
                  className={i === 0 ? 'font-bold text-ink' : i === ex.reply.length - 1 ? 'font-mono text-xs text-accent' : undefined}
                >
                  <Ltr text={line} />
                </p>
              ))}
            </div>
            <span className="bubble-in settle b4 self-start py-3.5" aria-hidden="true">
              <span className="typing">
                <span />
                <span />
                <span />
              </span>
            </span>
          </div>

          <div aria-hidden="true" className="flex items-center gap-2 border-t border-hairline bg-sheet px-3.5 py-3">
            <span className="flex-1 rounded-full border border-hairline bg-paper px-4 py-2 text-sm text-pewter">
              {ex.inputPlaceholder}
            </span>
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-solid text-on-accent">
              <Send className="size-4 rtl:-scale-x-100" />
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// Step 1: Instagram's share sheet with our account selected.
function ShareSheet({ t }: { t: Strings }) {
  const site = useSite();
  const s = t.home.how.share;

  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-[1.5rem] border border-hairline bg-sheet p-4 shadow-sheet">
      <span className="mx-auto mb-2 h-1 w-10 rounded-full bg-hairline" />
      <span className="pb-2 text-center text-sm font-bold text-ink">{s.title}</span>
      {[0, 1, 2].map((i) =>
        i === 1 ? (
          <span key={i} className="flex items-center gap-3 rounded-2xl bg-mist p-2.5">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent-solid text-on-accent">
              <Check className="size-5" />
            </span>
            <span className="flex flex-1 flex-col leading-tight">
              <span className="text-sm font-bold text-ink">{t.brand}</span>
              <span className="font-mono text-xs text-pewter" dir="ltr">
                @{site.instagramHandle}
              </span>
            </span>
            <span className="rounded-full bg-accent-solid px-4 py-1.5 text-xs font-bold text-on-accent">{s.send}</span>
          </span>
        ) : (
          <span key={i} className="flex items-center gap-3 p-2.5">
            <span className="size-10 rounded-full bg-wash" />
            <span className="flex flex-1 flex-col gap-2">
              <span className={i === 0 ? 'h-2.5 w-28 rounded-full bg-wash' : 'h-2.5 w-20 rounded-full bg-wash'} />
              <span className="h-2.5 w-14 rounded-full bg-wash" />
            </span>
            <span className="h-7 w-14 rounded-full border border-hairline" />
          </span>
        ),
      )}
    </div>
  );
}

// Step 2: we answer about the post's author, not tagged accounts.
function AuthorVisual({ t }: { t: Strings }) {
  const p = t.home.how.post;
  return (
    <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-[1.5rem] border border-hairline bg-sheet shadow-sheet">
      <div className="flex items-center gap-3 p-3.5">
        <span className="size-9 rounded-full bg-[linear-gradient(135deg,var(--mist),var(--accent-solid))]" />
        <bdi dir="ltr" className="font-mono text-sm font-semibold text-ink">
          @sample.shop
        </bdi>
        <span className="chip-accent ms-auto text-xs">
          <Check className="size-3.5" />
          {p.author}
        </span>
      </div>
      <div className="relative aspect-[4/3] bg-wash">
        <span className="absolute bottom-4 start-4 inline-flex items-center gap-2 rounded-full bg-sheet/90 px-3 py-1 text-xs text-pewter">
          <bdi dir="ltr" className="font-mono line-through">
            @brand.tag
          </bdi>
          <span>{p.tagged}</span>
        </span>
      </div>
    </div>
  );
}

// Step 3: the two possible answers.
function ResultVisual({ t }: { t: Strings }) {
  const r = t.home.how.results;
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-center gap-4 rounded-[1.5rem] border border-hairline bg-sheet p-5 shadow-sheet">
        <span className="flex size-11 items-center justify-center rounded-full bg-mist text-accent">
          <CheckCircle className="size-6" />
        </span>
        <span className="pill pill-done">{r.found}</span>
      </div>
      <div className="flex items-center gap-4 rounded-[1.5rem] border border-hairline bg-sheet p-5 shadow-sheet sm:ms-10">
        <span className="flex size-11 items-center justify-center rounded-full bg-wash text-graphite">
          <Clock className="size-6" />
        </span>
        <span className="pill pill-unknown">{r.wishlisted}</span>
      </div>
    </div>
  );
}

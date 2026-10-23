import type { Strings } from '../i18n';
import { directUrl, formatNumber, useSite } from '../site';
import { Ltr, Rich } from '../components/Rich';
import { Lock, Send, ShieldCheck } from '../components/Icons';

// What the service is and how to use the bot, plus a link to the Instagram account (PRD §7.2).
export function Home({ t }: { t: Strings }) {
  const site = useSite();
  const h = t.home;

  return (
    <>
      <section className="container-page grid items-center gap-10 py-12 sm:py-16 md:grid-cols-[1.15fr_1fr] md:gap-14 md:py-20">
        <div className="flex flex-col items-start gap-5">
          <p className="eyebrow">{h.eyebrow}</p>
          <h1 className="hero-title font-bold text-ink">{h.title}</h1>
          <p className="max-w-[60ch] text-lg leading-8 text-ink-2">
            <Rich text={h.lede} />
          </p>
          <div className="flex flex-col items-start gap-2 pt-2">
            <a href={directUrl(site.instagramHandle)} className="btn-primary">
              <Send className="size-4 rtl:-scale-x-100" />
              <span>
                <Rich text={h.cta} links={false} />
              </span>
            </a>
            <p className="text-sm text-ink-3">{h.ctaNote}</p>
          </div>
        </div>

        <figure className="flex flex-col gap-3">
          <div
            role="group"
            aria-label={h.example.label}
            className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-raised"
          >
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                <ShieldCheck className="size-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-ink">{t.brand}</span>
                <span className="text-xs text-ink-3" dir="ltr">
                  @{site.instagramHandle}
                </span>
              </span>
            </div>
            <p className="bubble-out self-end" dir="ltr">
              {h.example.shared}
            </p>
            <div className="bubble-in self-start">
              {h.example.reply.map((line, i) => (
                <p key={i} className={i === 0 ? 'font-semibold text-ink' : undefined}>
                  <Ltr text={line} />
                </p>
              ))}
            </div>
          </div>
          <figcaption className="text-xs leading-6 text-ink-3">{h.example.caption}</figcaption>
        </figure>
      </section>

      <section aria-labelledby="how" className="border-y border-line bg-surface">
        <div className="container-page grid gap-8 py-14 md:grid-cols-[1fr_1.6fr] md:gap-14 md:py-20">
          <div className="flex flex-col gap-3">
            <h2 id="how" className="text-2xl font-bold text-ink sm:text-3xl">
              {h.how.title}
            </h2>
            <p className="leading-8 text-ink-2">{h.how.intro}</p>
          </div>
          <ol className="flex flex-col">
            {h.how.steps.map((step, i) => (
              <li key={i} className="step">
                <span className="step-number">{formatNumber(site.locale, i + 1)}</span>
                <div className="flex flex-col gap-1 pb-8">
                  <h3 className="text-lg font-bold text-ink">{step.title}</h3>
                  <p className="leading-8 text-ink-2">
                    <Rich text={step.body} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="sources" className="container-page flex flex-col gap-8 py-14 md:py-20">
        <h2 id="sources" className="text-2xl font-bold text-ink sm:text-3xl">
          {h.sources.title}
        </h2>
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          {h.sources.items.map((item, i) => (
            <div
              key={i}
              className={
                i === 0
                  ? 'flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 shadow-card'
                  : 'flex flex-col gap-3 rounded-2xl border border-caution-line bg-caution-soft p-6 md:mt-12'
              }
            >
              <h3 className={i === 0 ? 'text-lg font-bold text-ink' : 'text-lg font-bold text-caution'}>
                {item.title}
              </h3>
              <p className="leading-8 text-ink-2">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="callout flex items-start gap-3">
          <Lock className="mt-1.5 size-4 shrink-0 text-brand" />
          <span>
            <Rich text={h.privacy} />
          </span>
        </p>
      </section>
    </>
  );
}

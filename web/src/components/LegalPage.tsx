import type { ReactNode } from 'react';
import type { Block, LegalDoc, Strings } from '../i18n';
import { formatNumber, useSite } from '../site';
import { Rich } from './Rich';

// Full legal text, always visible: no accordions, tabs or "read more" (PRD §7.1).
// Reading column on the start side, sticky contents rail on the end side at ≥ 1024px; the rail sits
// above the text on small screens (DESIGN.md §6). The rail is plain in-page anchors.
export function LegalPage({
  title,
  t,
  doc,
  children,
}: {
  title: string;
  t: Strings;
  doc?: LegalDoc;
  children?: ReactNode;
}) {
  const { locale } = useSite();

  return (
    <>
      <header className="border-b border-hairline">
        <div className="shell grid-12 gap-y-8 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="flex flex-col items-start gap-6 lg:col-span-9">
            {doc && <p className="chip-accent rise">{t.legal.eyebrow}</p>}
            <h1 className="t-display rise s1">{title}</h1>
            {doc?.intro.map((b, i) => (
              <div key={i} className="rise s2">
                <BlockView block={b} lead />
              </div>
            ))}
          </div>
          {doc && (
            <p className="t-label rise s3 lg:col-span-3 lg:self-end lg:text-end">
              {t.legal.updatedLabel}
              <br />
              <time dateTime="2026-10-23" className="text-ink">
                {t.legal.updated}
              </time>
            </p>
          )}
        </div>
      </header>

      <div className="shell grid-12 gap-y-12 py-14 sm:py-20">
        {doc && (
          <nav aria-labelledby="contents" className="lg:sticky lg:top-28 lg:order-last lg:col-span-3 lg:col-start-10 lg:self-start">
            <h2 id="contents" className="t-label mb-3">
              {t.legal.contentsLabel}
            </h2>
            <ol className="flex flex-col border-s border-hairline ps-4">
              {doc.sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="rail-link">
                    <span className="font-mono text-pewter">{formatNumber(locale, i + 1, 2)}</span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className={doc ? 'flex min-w-0 flex-col lg:col-span-8' : 'flex min-w-0 flex-col gap-8 lg:col-span-7'}>
          {doc?.sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-h`}
              className="grid scroll-mt-28 gap-x-6 gap-y-5 border-t border-hairline py-10 first:border-t-0 first:pt-0 sm:grid-cols-[4rem_minmax(0,1fr)] sm:py-14"
            >
              <span aria-hidden="true" className="font-mono text-3xl font-medium text-rule sm:pt-1">
                {formatNumber(locale, i + 1, 2)}
              </span>
              <div className="flex flex-col gap-5">
                <h2 id={`${s.id}-h`} className="text-2xl font-bold text-ink sm:text-[1.75rem]">
                  {s.heading}
                </h2>
                {s.body.map((b, j) => (
                  <BlockView key={j} block={b} />
                ))}
              </div>
            </section>
          ))}
          {doc && children ? <div className="flex flex-col gap-8 border-t border-hairline pt-14">{children}</div> : children}
        </article>
      </div>
    </>
  );
}

function BlockView({ block, lead }: { block: Block; lead?: boolean }) {
  const { locale } = useSite();
  if (typeof block === 'string') {
    return (
      <p className={lead ? 't-lede' : 't-body'}>
        <Rich text={block} />
      </p>
    );
  }
  if ('list' in block) {
    return (
      <ul className="legal-list t-body flex flex-col gap-3">
        {block.list.map((item, i) => (
          <li key={i}>
            <Rich text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="flex flex-col">
      {block.steps.map((item, i) => (
        <li key={i} className="flex gap-5 border-t border-hairline py-5 first:border-t-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-solid font-mono text-sm font-semibold text-on-accent">
            {formatNumber(locale, i + 1)}
          </span>
          <p className="t-body">
            <Rich text={item} />
          </p>
        </li>
      ))}
    </ol>
  );
}

import type { ReactNode } from 'react';
import type { Block, LegalDoc, Strings } from '../i18n';
import { formatNumber, useSite } from '../site';
import { Rich } from './Rich';

// Full legal text, always visible: no accordions, tabs or "read more" (PRD §7.1).
// The contents list is plain in-page anchors; every section is rendered in full below it.
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
    <div className="container-page py-10 sm:py-14">
      <article className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-line pb-8">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          {doc && (
            <p className="text-sm text-ink-3">
              {t.legal.updatedLabel}: <time dateTime="2026-10-23">{t.legal.updated}</time>
            </p>
          )}
          {doc?.intro.map((b, i) => <BlockView key={i} block={b} lead />)}
        </header>

        {doc && doc.sections.length > 3 && (
          <nav aria-labelledby="contents" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 id="contents" className="text-xs font-semibold text-brand">
              {t.legal.contentsLabel}
            </h2>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {doc.sections.map((s, i) => (
                <li key={s.id} className="flex gap-2">
                  <span className="w-5 shrink-0 text-ink-3">{formatNumber(locale, i + 1)}</span>
                  <a href={`#${s.id}`} className="link">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {doc?.sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex scroll-mt-6 flex-col gap-4">
            <h2 id={`${s.id}-h`} className="flex gap-3 text-lg font-bold text-ink">
              <span className="text-ink-3">{formatNumber(locale, i + 1)}.</span>
              {s.heading}
            </h2>
            {s.body.map((b, j) => (
              <BlockView key={j} block={b} />
            ))}
          </section>
        ))}

        {children}
      </article>
    </div>
  );
}

function BlockView({ block, lead }: { block: Block; lead?: boolean }) {
  const { locale } = useSite();
  if (typeof block === 'string') {
    return (
      <p className={lead ? 'text-lg leading-8 text-ink-2' : 'leading-8 text-ink-2'}>
        <Rich text={block} />
      </p>
    );
  }
  if ('list' in block) {
    return (
      <ul className="flex flex-col gap-2 ps-5 leading-8 text-ink-2 marker:text-brand list-disc">
        {block.list.map((item, i) => (
          <li key={i}>
            <Rich text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {block.steps.map((item, i) => (
        <li key={i} className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
            {formatNumber(locale, i + 1)}
          </span>
          <p className="leading-8 text-ink-2">
            <Rich text={item} />
          </p>
        </li>
      ))}
    </ol>
  );
}

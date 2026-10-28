import type { ReactNode } from 'react';
import type { Route } from '../routes';
import type { Strings } from '../i18n';
import { strings } from '../i18n';
import { instagramUrl, useSite } from '../site';
import { Check, Globe } from './Icons';
import { Rich } from './Rich';

const SUBPATHS: Record<Route['page'], string> = {
  home: '',
  privacy: '/privacy',
  terms: '/terms',
  dataDeletion: '/data-deletion',
  deletionStatus: '/data-deletion',
  notFound: '',
};

// Header with language switcher, footer with the legal links on every page (PRD §7.1, §7.3).
// Plain links only, so it works without JavaScript; no hamburger menu (DESIGN.md §7).
export function Layout({ route, t, children }: { route: Route; t: Strings; children: ReactNode }) {
  const site = useSite();
  const base = `/${route.locale}`;
  const other = t.otherLocale;
  const legal = [
    { page: 'privacy', href: `${base}/privacy`, label: t.nav.privacy },
    { page: 'terms', href: `${base}/terms`, label: t.nav.terms },
    { page: 'dataDeletion', href: `${base}/data-deletion`, label: t.nav.dataDeletion },
  ] as const;
  const current = (page: string) =>
    page === route.page || (page === 'dataDeletion' && route.page === 'deletionStatus') ? 'page' : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        {t.skipLink}
      </a>

      <div aria-hidden="true" className="scroll-progress" />
      <header className="site-header sticky top-0 z-40 border-b border-hairline bg-paper/80 backdrop-blur-xl">
        <div className="shell flex flex-wrap items-center justify-between gap-x-4 py-2">
          <Wordmark href={base} name={t.brand} />
          <nav aria-label={t.nav.label} className="order-last -ms-3 flex w-full sm:order-none sm:ms-0 sm:w-auto">
            {legal.map((l) => (
              <a key={l.page} href={l.href} aria-current={current(l.page)} className="nav-link">
                {l.label}
              </a>
            ))}
          </nav>
          <a href={`/${other}${SUBPATHS[route.page]}`} hrefLang={other} lang={other} className="btn-ghost">
            <Globe className="size-4" />
            {strings[other].languageName}
          </a>
        </div>
      </header>

      <main id="main" className="flex-1 overflow-x-clip">
        {children}
      </main>

      <footer className="border-t border-hairline">
        <div className="shell grid-12 gap-y-12 pt-16 pb-10">
          <div className="flex flex-col gap-5 lg:col-span-5">
            <Wordmark href={base} name={t.brand} />
            <p className="t-body max-w-sm text-pewter">{t.footer.about}</p>
          </div>
          <nav aria-label={t.nav.label} className="flex flex-col gap-1 lg:col-span-3 lg:col-start-7">
            <h2 className="t-label mb-3">{t.footer.legal}</h2>
            {legal.map((l) => (
              <a
                key={l.page}
                href={l.href}
                aria-current={current(l.page)}
                className="py-1 text-ink transition-colors hover:text-accent aria-[current=page]:text-accent"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-1 lg:col-span-3">
            <h2 className="t-label mb-3">{t.footer.contact}</h2>
            <a href={`mailto:${site.contactEmail}`} className="py-1 text-ink transition-colors hover:text-accent" dir="ltr">
              {site.contactEmail}
            </a>
            <a href={instagramUrl(site.instagramHandle)} className="py-1 text-ink transition-colors hover:text-accent" dir="ltr">
              @{site.instagramHandle}
            </a>
          </div>
        </div>
        <div className="shell overflow-hidden">
          <p
            aria-hidden="true"
            className="wordmark-rise select-none border-t border-hairline pt-6 text-[clamp(4rem,17vw,15rem)] leading-[0.95] font-extrabold text-wash"
          >
            {t.brand}
          </p>
          <p className="pb-8 pt-4 text-xs leading-6 text-pewter">
            <Rich text={t.footer.rights} />
          </p>
        </div>
      </footer>
    </div>
  );
}

// The mark: a verdict stamp (circle with a check) beside the name.
function Wordmark({ href, name }: { href: string; name: string }) {
  return (
    <a href={href} className="flex min-h-11 items-center gap-2.5 text-lg font-bold text-ink">
      <span className="flex size-8 items-center justify-center rounded-full bg-accent-solid text-on-accent">
        <Check className="size-4.5" />
      </span>
      {name}
    </a>
  );
}

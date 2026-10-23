import type { ReactNode } from 'react';
import type { Route } from '../routes';
import type { Strings } from '../i18n';
import { strings } from '../i18n';
import { instagramUrl, useSite } from '../site';
import { Globe, Mail, ShieldCheck } from './Icons';
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
// Plain links only, so it works without JavaScript.
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

      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <a href={base} className="flex items-center gap-2 text-lg font-bold text-ink">
            <ShieldCheck className="size-6 text-brand" />
            {t.brand}
          </a>
          <div className="flex items-center gap-1">
            <nav aria-label={t.nav.label} className="hidden items-center gap-1 md:flex">
              {legal.map((l) => (
                <a key={l.page} href={l.href} aria-current={current(l.page)} className="nav-link">
                  {l.label}
                </a>
              ))}
            </nav>
            <a
              href={`/${other}${SUBPATHS[route.page]}`}
              hrefLang={other}
              lang={other}
              className="btn-small ms-2"
            >
              <Globe className="size-4" />
              {strings[other].languageName}
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-line bg-surface">
        <div className="container-page grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <a href={base} className="flex items-center gap-2 font-bold text-ink">
              <ShieldCheck className="size-5 text-brand" />
              {t.brand}
            </a>
            <p className="max-w-sm text-sm leading-7 text-ink-2">{t.footer.about}</p>
          </div>
          <nav aria-label={t.nav.label} className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-ink-3">{t.footer.legal}</h2>
            {legal.map((l) => (
              <a key={l.page} href={l.href} aria-current={current(l.page)} className="footer-link">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-ink-3">{t.footer.contact}</h2>
            <a href={`mailto:${site.contactEmail}`} className="footer-link inline-flex items-center gap-2" dir="ltr">
              <Mail className="size-4 shrink-0" />
              {site.contactEmail}
            </a>
            <a href={instagramUrl(site.instagramHandle)} className="footer-link" dir="ltr">
              @{site.instagramHandle}
            </a>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="container-page py-4 text-xs leading-6 text-ink-3">
            <Rich text={t.footer.rights} />
          </p>
        </div>
      </footer>
    </div>
  );
}

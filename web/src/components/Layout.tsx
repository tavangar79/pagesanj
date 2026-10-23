import type { ReactNode } from 'react';
import type { Route } from '../routes';
import type { Strings } from '../i18n';
import { strings } from '../i18n';

const SUBPATHS: Record<Route['page'], string> = {
  home: '',
  privacy: '/privacy',
  terms: '/terms',
  dataDeletion: '/data-deletion',
  deletionStatus: '/data-deletion',
  notFound: '',
};

// Header with language switcher, footer with the legal links on every page (PRD §7.1, §7.3).
export function Layout({ route, t, children }: { route: Route; t: Strings; children: ReactNode }) {
  const base = `/${route.locale}`;
  const other = t.otherLocale;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between py-6">
        <a href={base} className="font-bold">
          {t.titles.home}
        </a>
        <a href={`/${other}${SUBPATHS[route.page]}`} hrefLang={other} lang={other}>
          {strings[other].languageName}
        </a>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="flex flex-wrap gap-4 border-t border-border py-6 text-sm text-muted">
        <a href={`${base}/privacy`}>{t.nav.privacy}</a>
        <a href={`${base}/terms`}>{t.nav.terms}</a>
        <a href={`${base}/data-deletion`}>{t.nav.dataDeletion}</a>
      </footer>
    </div>
  );
}

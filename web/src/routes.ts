// Maps a URL to a page and locale (PRD §7.2). `/` itself is redirected by Express.
export type Locale = 'fa' | 'en';
export type PageId = 'home' | 'privacy' | 'terms' | 'dataDeletion' | 'deletionStatus' | 'notFound';

export type Route = { locale: Locale; page: PageId; query: URLSearchParams };

const PAGES: Record<string, PageId> = {
  '': 'home',
  privacy: 'privacy',
  terms: 'terms',
  'data-deletion': 'dataDeletion',
  'data-deletion/status': 'deletionStatus',
};

export function matchRoute(url: string): Route {
  const { pathname, searchParams } = new URL(url, 'http://localhost');
  const [, first = '', ...rest] = pathname.replace(/\/+$/, '').split('/');
  const locale: Locale = first === 'en' ? 'en' : 'fa';
  const page = first === 'fa' || first === 'en' ? (PAGES[rest.join('/')] ?? 'notFound') : 'notFound';
  return { locale, page, query: searchParams };
}

export function dirFor(locale: Locale) {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

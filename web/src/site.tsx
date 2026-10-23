// Values from the server (PRD §7.3: contact email, app and company name) shared by every page.
import { createContext, useContext } from 'react';
import type { Locale } from './routes';

export type Site = {
  locale: Locale;
  brand: string;
  contactEmail: string;
  instagramHandle: string;
  companyName: string;
};

// PRD §7.2 names the account @trustme; SITE_INSTAGRAM_HANDLE overrides it.
export const DEFAULT_HANDLE = 'trustme';

export const SiteContext = createContext<Site | null>(null);

export function useSite(): Site {
  const site = useContext(SiteContext);
  if (!site) throw new Error('SiteContext missing');
  return site;
}

export const instagramUrl = (handle: string) => `https://www.instagram.com/${handle}/`;
// Opens a DM thread with the account in the Instagram app or website.
export const directUrl = (handle: string) => `https://ig.me/m/${handle}`;

export const formatNumber = (locale: Locale, n: number) =>
  new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(n);

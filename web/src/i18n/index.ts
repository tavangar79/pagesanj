import { fa } from './fa';
import { en } from './en';
import type { Locale, PageId } from '../routes';

export type Strings = {
  languageName: string;
  otherLocale: Locale;
  nav: { home: string; privacy: string; terms: string; dataDeletion: string };
  titles: Record<PageId, string>;
  deletion: {
    checkLabel: string;
    checkButton: string;
    pending: string;
    done: string;
    unknown: string;
  };
};

export const strings: Record<Locale, Strings> = { fa, en };

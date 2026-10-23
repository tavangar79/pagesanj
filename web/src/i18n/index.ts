import { fa } from './fa';
import { en } from './en';
import type { Locale, PageId } from '../routes';

// Copy may use {email}, {handle}, {company} and [label](page) links; see components/Rich.tsx.
export type Block = string | { list: string[] } | { steps: string[] };
export type Section = { id: string; heading: string; body: Block[] };
export type LegalDoc = { intro: Block[]; sections: Section[] };

export type Strings = {
  languageName: string;
  otherLocale: Locale;
  brand: string;
  skipLink: string;
  nav: { home: string; privacy: string; terms: string; dataDeletion: string; label: string };
  titles: Record<PageId, string>;
  home: {
    eyebrow: string;
    title: string;
    lede: string;
    cta: string;
    ctaNote: string;
    example: {
      label: string;
      caption: string;
      shared: string;
      reply: string[];
    };
    how: { title: string; intro: string; steps: { title: string; body: string }[] };
    sources: { title: string; items: { title: string; body: string }[] };
    privacy: string;
  };
  legal: { updatedLabel: string; updated: string; contentsLabel: string };
  privacy: LegalDoc;
  terms: LegalDoc;
  dataDeletion: LegalDoc;
  deletion: {
    checkTitle: string;
    checkHelp: string;
    checkLabel: string;
    checkButton: string;
    pending: string;
    done: string;
    unknown: string;
    missing: string;
    statusPending: string;
    statusDone: string;
    statusUnknown: string;
    back: string;
  };
  notFound: { body: string; home: string };
  footer: { about: string; contact: string; legal: string; rights: string };
};

export const strings: Record<Locale, Strings> = { fa, en };

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
    // The hero headline: words, an accent phrase and inline visual capsules (DESIGN.md §4).
    headline: (string | { accent: string } | { capsule: 'page' | 'dm' | 'verdict' })[];
    verdict: string;
    sendLabel: string;
    sendExamples: string[];
    lede: string;
    cta: string;
    ctaNote: string;
    example: {
      label: string;
      caption: string;
      today: string;
      shared: string;
      sharedKind: string;
      checking: string;
      reply: string[];
      inputPlaceholder: string;
    };
    how: {
      eyebrow: string;
      title: string;
      intro: string;
      steps: { title: string; body: string }[];
      share: { title: string; send: string };
      post: { author: string; tagged: string };
      results: { found: string; wishlisted: string };
    };
    sources: { eyebrow: string; title: string; intro: string; items: { title: string; body: string }[] };
    privacyBand: { eyebrow: string; title: string; facts: { value: string; label: string }[]; link: string };
    final: { title: string; body: string };
  };
  legal: { eyebrow: string; updatedLabel: string; updated: string; contentsLabel: string };
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

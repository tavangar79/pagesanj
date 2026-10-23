import type { Strings } from './index';

// English website copy (PRD §7). Complete, not a summary: Meta reviewers read English.
export const en: Strings = {
  languageName: 'English',
  otherLocale: 'fa',
  nav: {
    home: 'Home',
    privacy: 'Privacy',
    terms: 'Terms',
    dataDeletion: 'Data deletion',
  },
  titles: {
    home: 'pagesanj',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    dataDeletion: 'Data Deletion',
    deletionStatus: 'Deletion Request Status',
    notFound: 'Page not found',
  },
  deletion: {
    checkLabel: 'Confirmation code',
    checkButton: 'Check status',
    pending: 'Your request is being processed.',
    done: 'Your data has been deleted.',
    unknown: 'We could not find this code.',
  },
};

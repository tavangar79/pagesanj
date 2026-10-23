import type { Strings } from '../i18n';
import type { Locale } from '../routes';
import { LegalPage } from '../components/LegalPage';
import { StatusForm } from '../components/StatusForm';

// Deletion instructions plus a plain GET form to check a code (PRD §7.2, §7.3).
export function DataDeletion({ t, locale }: { t: Strings; locale: Locale }) {
  return (
    <LegalPage title={t.titles.dataDeletion} t={t} doc={t.dataDeletion}>
      <StatusForm t={t} locale={locale} />
    </LegalPage>
  );
}

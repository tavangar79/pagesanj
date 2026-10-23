import type { Strings } from '../i18n';
import type { Locale } from '../routes';
import { LegalPage } from '../components/LegalPage';

// Deletion instructions plus a plain GET form to check a code (PRD §7.2, §7.3).
export function DataDeletion({ t, locale }: { t: Strings; locale: Locale }) {
  return (
    <LegalPage title={t.titles.dataDeletion}>
      {/* TODO: steps (remove app in Instagram settings, DM us, or email CONTACT_EMAIL),
          what gets deleted, and how long it takes. */}
      <form method="get" action={`/${locale}/data-deletion/status`} className="flex gap-2">
        <label htmlFor="code">{t.deletion.checkLabel}</label>
        <input id="code" name="code" required dir="ltr" className="border border-border px-2" />
        <button type="submit">{t.deletion.checkButton}</button>
      </form>
    </LegalPage>
  );
}

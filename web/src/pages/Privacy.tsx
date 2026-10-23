import type { Strings } from '../i18n';
import { LegalPage } from '../components/LegalPage';

// Privacy policy (PRD §7.3 checklist).
export function Privacy({ t }: { t: Strings }) {
  return (
    <LegalPage title={t.titles.privacy}>
      {/* TODO: app and company name, what we collect, why, 90-day retention, no selling/ads, deletion link, CONTACT_EMAIL. */}
    </LegalPage>
  );
}

import type { Strings } from '../i18n';
import { LegalPage } from '../components/LegalPage';

// Privacy policy (PRD §7.3 checklist): app and company name, what we collect, why, 90-day retention,
// no selling or ads, a link to the deletion page and the contact email. All copy is in i18n.
export function Privacy({ t }: { t: Strings }) {
  return <LegalPage title={t.titles.privacy} t={t} doc={t.privacy} />;
}

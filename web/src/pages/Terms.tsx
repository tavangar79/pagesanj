import type { Strings } from '../i18n';
import { LegalPage } from '../components/LegalPage';

// Terms of use, with the disclaimer that answers are informational (PRD §7.2).
export function Terms({ t }: { t: Strings }) {
  return <LegalPage title={t.titles.terms} t={t} doc={t.terms} />;
}

import type { Strings } from '../i18n';
import { LegalPage } from '../components/LegalPage';

// Terms of use (PRD §7.2).
export function Terms({ t }: { t: Strings }) {
  return (
    <LegalPage title={t.titles.terms}>
      {/* TODO: terms text and the disclaimer that answers are informational. */}
    </LegalPage>
  );
}

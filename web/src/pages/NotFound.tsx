import type { Strings } from '../i18n';
import { LegalPage } from '../components/LegalPage';

// 404 page.
export function NotFound({ t }: { t: Strings }) {
  return (
    <LegalPage title={t.titles.notFound}>
      {/* TODO: short message and a link home. */}
    </LegalPage>
  );
}

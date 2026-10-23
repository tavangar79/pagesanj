import type { Strings } from '../i18n';
import { LegalPage } from '../components/LegalPage';

// Status for a confirmation code; this is the url returned to Meta's callback (PRD §7.2).
export function DeletionStatus({
  t,
  code,
  status,
}: {
  t: Strings;
  code: string | null;
  status: 'pending' | 'done' | null;
}) {
  const message = status === 'pending' ? t.deletion.pending : status === 'done' ? t.deletion.done : t.deletion.unknown;

  return (
    <LegalPage title={t.titles.deletionStatus}>
      {code && (
        <p>
          {t.deletion.checkLabel}: <code dir="ltr">{code}</code>
        </p>
      )}
      <p>{message}</p>
    </LegalPage>
  );
}

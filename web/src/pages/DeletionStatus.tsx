import type { Strings } from '../i18n';
import type { Locale } from '../routes';
import { LegalPage } from '../components/LegalPage';
import { StatusForm } from '../components/StatusForm';

// Status for a confirmation code; this is the url returned to Meta's callback (PRD §7.2).
// The status is text in a pill, never colour alone (MASTER.md).
export function DeletionStatus({
  t,
  locale,
  code,
  status,
}: {
  t: Strings;
  locale: Locale;
  code: string | null;
  status: 'pending' | 'done' | null;
}) {
  const d = t.deletion;
  const view = !code
    ? null
    : status === 'done'
      ? { pill: 'pill-success', label: d.statusDone, message: d.done }
      : status === 'pending'
        ? { pill: 'pill-caution', label: d.statusPending, message: d.pending }
        : { pill: 'pill-neutral', label: d.statusUnknown, message: d.unknown };

  return (
    <LegalPage title={t.titles.deletionStatus} t={t}>
      {view ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" role="status">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-3">
              {d.checkLabel}:{' '}
              <code dir="ltr" className="font-mono text-ink">
                {code}
              </code>
            </p>
            <span className={view.pill}>{view.label}</span>
          </div>
          <p className="text-lg leading-8 text-ink">{view.message}</p>
        </div>
      ) : (
        <p className="leading-8 text-ink-2">{d.missing}</p>
      )}
      <StatusForm t={t} locale={locale} code={code} />
      <a href={`/${locale}/data-deletion`} className="link self-start">
        {d.back}
      </a>
    </LegalPage>
  );
}

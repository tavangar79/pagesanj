import type { Strings } from '../i18n';
import type { Locale } from '../routes';
import { LegalPage } from '../components/LegalPage';
import { StatusForm } from '../components/StatusForm';
import { CheckCircle, ChevronBack, Clock, SearchX } from '../components/Icons';

// Status for a confirmation code; this is the url returned to Meta's callback (PRD §7.2).
// The status is text in a pill, never colour alone (DESIGN.md §5).
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
      ? { pill: 'pill-done', tile: 'bg-mist text-accent', Icon: CheckCircle, label: d.statusDone, message: d.done }
      : status === 'pending'
        ? { pill: 'pill-pending', tile: 'bg-caution-soft text-caution', Icon: Clock, label: d.statusPending, message: d.pending }
        : { pill: 'pill-unknown', tile: 'bg-wash text-graphite', Icon: SearchX, label: d.statusUnknown, message: d.unknown };

  return (
    <LegalPage title={t.titles.deletionStatus} t={t}>
      {view ? (
        <div className="sheet settle flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-10" role="status">
          <span className={`flex size-16 shrink-0 items-center justify-center rounded-full ${view.tile}`}>
            <view.Icon className="size-8" />
          </span>
          <div className="flex flex-col gap-4">
            <span className={`pill ${view.pill} self-start`}>{view.label}</span>
            <p className="text-2xl font-bold leading-snug text-ink">{view.message}</p>
            <p className="t-label">
              {d.checkLabel}:{' '}
              <code dir="ltr" className="text-ink">
                {code}
              </code>
            </p>
          </div>
        </div>
      ) : (
        <p className="t-lede">{d.missing}</p>
      )}
      <StatusForm t={t} locale={locale} code={code} />
      <a href={`/${locale}/data-deletion`} className="link inline-flex items-center gap-1.5 self-start">
        <ChevronBack className="size-4 rtl:-scale-x-100" />
        {d.back}
      </a>
    </LegalPage>
  );
}

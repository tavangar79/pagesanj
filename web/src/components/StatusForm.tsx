import type { Strings } from '../i18n';
import type { Locale } from '../routes';

// Plain GET form to check a confirmation code; works without JavaScript (PRD §7.1, §7.2).
export function StatusForm({ t, locale, code }: { t: Strings; locale: Locale; code?: string | null }) {
  return (
    <form
      method="get"
      action={`/${locale}/data-deletion/status`}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-ink">{t.deletion.checkTitle}</h2>
        <p className="text-sm leading-7 text-ink-2">{t.deletion.checkHelp}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-ink-2">
          {t.deletion.checkLabel}
          <input
            name="code"
            required
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            defaultValue={code ?? undefined}
            className="input font-mono"
          />
        </label>
        <button type="submit" className="btn-primary">
          {t.deletion.checkButton}
        </button>
      </div>
    </form>
  );
}

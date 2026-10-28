import type { Strings } from '../i18n';
import type { Locale } from '../routes';
import { ArrowEnd } from './Icons';

// Plain GET form to check a confirmation code; works without JavaScript (PRD §7.1, §7.2).
export function StatusForm({ t, locale, code }: { t: Strings; locale: Locale; code?: string | null }) {
  return (
    <form method="get" action={`/${locale}/data-deletion/status`} className="sheet flex flex-col gap-6 p-6 sm:p-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-ink">{t.deletion.checkTitle}</h2>
        <p className="t-body">{t.deletion.checkHelp}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-ink">
          {t.deletion.checkLabel}
          <input
            name="code"
            required
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            placeholder="0123456789abcdef"
            defaultValue={code ?? undefined}
            className="input font-mono"
          />
        </label>
        <button type="submit" className="btn">
          {t.deletion.checkButton}
          <ArrowEnd className="btn-arrow" />
        </button>
      </div>
    </form>
  );
}

import type { Strings } from '../i18n';
import type { Locale } from '../routes';
import { LegalPage } from '../components/LegalPage';
import { ArrowEnd } from '../components/Icons';
import { formatNumber } from '../site';

// 404 page: a composed empty state with the next action (DESIGN.md §5).
export function NotFound({ t, locale }: { t: Strings; locale: Locale }) {
  return (
    <LegalPage title={t.titles.notFound} t={t}>
      <p aria-hidden="true" className="font-mono text-[clamp(5rem,18vw,12rem)] leading-none font-medium text-hairline">
        {formatNumber(locale, 404)}
      </p>
      <p className="t-lede">{t.notFound.body}</p>
      <a href={`/${locale}`} className="btn self-start">
        {t.notFound.home}
        <ArrowEnd className="btn-arrow" />
      </a>
    </LegalPage>
  );
}

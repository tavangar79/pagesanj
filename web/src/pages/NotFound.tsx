import type { Strings } from '../i18n';
import type { Locale } from '../routes';
import { LegalPage } from '../components/LegalPage';

// 404 page.
export function NotFound({ t, locale }: { t: Strings; locale: Locale }) {
  return (
    <LegalPage title={t.titles.notFound} t={t}>
      <p className="leading-8 text-ink-2">{t.notFound.body}</p>
      <a href={`/${locale}`} className="btn-primary self-start">
        {t.notFound.home}
      </a>
    </LegalPage>
  );
}

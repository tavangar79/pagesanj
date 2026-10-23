import type { Strings } from '../i18n';
import { LegalPage } from '../components/LegalPage';

// What the service is and how to use the bot (PRD §7.2).
export function Home({ t }: { t: Strings }) {
  return (
    <LegalPage title={t.titles.home}>
      {/* TODO: share a page or post with the Instagram account in a DM; link to the account. */}
    </LegalPage>
  );
}

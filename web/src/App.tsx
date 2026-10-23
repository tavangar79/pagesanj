import { Layout } from './components/Layout';
import { matchRoute } from './routes';
import { strings } from './i18n';
import { Home } from './pages/Home';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { DataDeletion } from './pages/DataDeletion';
import { DeletionStatus } from './pages/DeletionStatus';
import { NotFound } from './pages/NotFound';

// Server data passed in by Express, e.g. a deletion code's status.
export type PageData = {
  // CONTACT_EMAIL, shown on the legal pages (PRD §7.3).
  contactEmail?: string;
  deletionStatus?: 'pending' | 'done' | null;
};

export function App({ url, data }: { url: string; data: PageData }) {
  const route = matchRoute(url);
  const t = strings[route.locale];

  const pages = {
    home: <Home t={t} />,
    privacy: <Privacy t={t} />,
    terms: <Terms t={t} />,
    dataDeletion: <DataDeletion t={t} locale={route.locale} />,
    deletionStatus: (
      <DeletionStatus t={t} code={route.query.get('code')} status={data.deletionStatus ?? null} />
    ),
    notFound: <NotFound t={t} />,
  };

  return (
    <Layout route={route} t={t}>
      {pages[route.page]}
    </Layout>
  );
}

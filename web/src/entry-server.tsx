// SSR entry, called by Express for every public route (PRD §7.1, §11).
import { renderToString } from 'react-dom/server';
import { App, type PageData } from './App';
import { dirFor, matchRoute } from './routes';
import { strings } from './i18n';

export type { PageData };

export function render(url: string, data: PageData = {}) {
  const route = matchRoute(url);
  return {
    html: renderToString(<App url={url} data={data} />),
    lang: route.locale,
    dir: dirFor(route.locale),
    title: strings[route.locale].titles[route.page],
    status: route.page === 'notFound' ? 404 : 200,
  };
}

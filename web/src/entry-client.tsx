// Optional hydration. Pages must read fully without it (PRD §7.1).
import { hydrateRoot } from 'react-dom/client';
import { App, type PageData } from './App';
import './index.css';

const dataEl = document.getElementById('ssr-data');
const data: PageData = dataEl?.textContent ? JSON.parse(dataEl.textContent) : {};

hydrateRoot(
  document.getElementById('root')!,
  <App url={window.location.pathname + window.location.search} data={data} />,
);

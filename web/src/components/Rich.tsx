// Renders copy from i18n: {email}, {handle} and {company} become values, [label](page) a link to a
// page in the current locale. Handles and emails are shown dir="ltr" (root CLAUDE.md).
import { Fragment, type ReactNode } from 'react';
import { instagramUrl, useSite } from '../site';

const TOKEN = /\{(email|handle|company)\}|\[([^\]]+)\]\(([a-z-/]*)\)/g;

export function Rich({ text, links = true }: { text: string; links?: boolean }) {
  const site = useSite();
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    out.push(text.slice(last, m.index));
    const [, token, label, page] = m;
    if (token === 'email') {
      out.push(
        <a key={m.index} href={`mailto:${site.contactEmail}`} dir="ltr" className="link">
          {site.contactEmail}
        </a>,
      );
    } else if (token === 'handle' && !links) {
      out.push(
        <bdi key={m.index} dir="ltr">
          @{site.instagramHandle}
        </bdi>,
      );
    } else if (token === 'handle') {
      out.push(
        <a key={m.index} href={instagramUrl(site.instagramHandle)} dir="ltr" className="link">
          @{site.instagramHandle}
        </a>,
      );
    } else if (token === 'company') {
      out.push(<bdi key={m.index}>{site.companyName}</bdi>);
    } else {
      out.push(
        <a key={m.index} href={`/${site.locale}${page ? `/${page}` : ''}`} className="link">
          {label}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out.map((part, i) => (typeof part === 'string' ? <Fragment key={`t${i}`}>{part}</Fragment> : part))}</>;
}

const LTR_RUN = /(@[\w.]+|[\w.]+\.com\S*)/;

/** Isolates handles and URLs inside Persian text so the bidi algorithm doesn't flip them. */
export function Ltr({ text }: { text: string }) {
  return (
    <>
      {text.split(LTR_RUN).map((part, i) =>
        i % 2 ? (
          <bdi key={i} dir="ltr">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}

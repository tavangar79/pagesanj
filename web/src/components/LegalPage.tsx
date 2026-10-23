import type { ReactNode } from 'react';

// Full legal text, always visible: no accordions, tabs or "read more" (PRD §7.1).
export function LegalPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <article className="space-y-4 leading-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </article>
  );
}

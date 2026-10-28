// Chips typed one at a time (tags, previous handles). Enter or comma adds; Backspace on empty removes the last.
import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TagInput({
  id,
  value,
  onChange,
  normalize = (s) => s.trim().replace(/\s+/g, ' '),
  placeholder,
  ltr = false,
  max = 20,
  prefix = '',
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  normalize?: (raw: string) => string;
  placeholder?: string;
  ltr?: boolean;
  max?: number;
  prefix?: string;
}) {
  const [draft, setDraft] = useState('');

  function add(raw: string) {
    const item = normalize(raw);
    if (item && !value.includes(item) && value.length < max) onChange([...value, item]);
    setDraft('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-2 py-1.5 transition-colors',
        'focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15',
      )}
    >
      {value.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded-full border border-line bg-subtle py-0.5 ps-2.5 pe-1 text-xs font-medium text-ink-2">
          <span dir={ltr ? 'ltr' : undefined}>
            {prefix}
            {item}
          </span>
          <button
            type="button"
            className="grid size-5 place-items-center rounded-full text-ink-3 hover:bg-line hover:text-ink"
            onClick={() => onChange(value.filter((v) => v !== item))}
            aria-label={`حذف ${prefix}${item}`}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        dir={ltr ? 'ltr' : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? undefined : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-ink-3"
      />
    </div>
  );
}

/** Instagram handle as stored by the backend: lowercase, no `@`, no URL. */
export function normalizeHandle(raw: string) {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
    .toLowerCase();
}

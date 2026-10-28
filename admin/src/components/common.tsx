// Shared admin pieces: page header, list states, LTR handles, pagination, segmented filter (PRD §9).
import type { ReactNode } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage, num } from '@/lib/labels';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('overflow-hidden rounded-2xl border border-line bg-surface shadow-card', className)}>{children}</div>;
}

export function LoadingRows({ rows = 5, label = 'در حال بارگذاری…' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg bg-subtle" />
      ))}
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-subtle text-ink-3">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="max-w-sm text-sm leading-6 text-ink-3">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <p className="font-semibold text-ink">بارگذاری انجام نشد</p>
      <p className="max-w-sm text-sm leading-6 text-ink-3">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          تلاش دوباره
        </Button>
      )}
    </div>
  );
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'note' | 'info'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm leading-6',
        tone === 'error' && 'border-danger-line bg-danger-soft text-danger',
        tone === 'note' && 'border-caution-line bg-caution-soft text-caution',
        tone === 'info' && 'border-brand-line bg-brand-soft text-ink',
      )}
    >
      {children}
    </div>
  );
}

/** Text that must read left-to-right inside RTL copy: handles, URLs, emails, phones. */
export function Ltr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={cn('inline-block', className)}>
      {children}
    </span>
  );
}

export function Handle({ handle, link = true, className }: { handle: string; link?: boolean; className?: string }) {
  const text = `@${handle}`;
  if (!link) return <Ltr className={cn('font-medium', className)}>{text}</Ltr>;
  return (
    <a
      href={`https://www.instagram.com/${encodeURIComponent(handle)}/`}
      target="_blank"
      rel="noreferrer noopener"
      dir="ltr"
      className={cn('inline-block font-medium text-brand underline-offset-4 hover:underline', className)}
    >
      {text}
    </a>
  );
}

export function Pagination({
  page,
  limit,
  total,
  onPage,
}: {
  page: number;
  limit: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return null;
  return (
    <nav aria-label="صفحه‌بندی" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-3">
      <span>
        صفحهٔ {num(page)} از {num(pages)} · {num(total)} مورد
      </span>
      <div className="flex gap-2">
        {/* RTL: "previous" points right, "next" points left. */}
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronRight aria-hidden="true" />
          قبلی
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          بعدی
          <ChevronLeft aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

/** Tab-like single choice (status filters, direction). A radiogroup, keyboard-usable with Tab + Space. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = 'default',
}: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  size?: 'default' | 'sm';
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-subtle p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg px-3 font-medium transition-colors',
              size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
              active ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-5 text-ink-3">{hint}</p>
      )}
    </div>
  );
}

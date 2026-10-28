// Recent jobRuns, Apify usage this month, run daily check now (PRD §6.2, §9.2.6).
import { useState } from 'react';
import { ExternalLink, Loader2, Play, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, EmptyState, ErrorState, LoadingRows, PageHeader, Panel } from '@/components/common';
import { useToast } from '@/components/toast';
import { get, post, qs } from '@/lib/api';
import { COUNT_LABELS, JOB_TYPE_LABELS, errorMessage, fmtAgo, fmtDateTime, money, num } from '@/lib/labels';
import { JOB_TYPES, type JobRun, type JobType, type Usage } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { cn } from '@/lib/utils';

const ALL = '__all';

function duration(run: JobRun) {
  if (!run.finishedAt) return null;
  const seconds = Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000);
  return seconds < 60 ? `${num(seconds)} ثانیه` : `${num(Math.round(seconds / 60))} دقیقه`;
}

function RunStatus({ run }: { run: JobRun }) {
  if (run.error) return <Badge variant="danger">خطا</Badge>;
  if (!run.finishedAt) return <Badge variant="default">در حال اجرا</Badge>;
  return <Badge variant="success">انجام شد</Badge>;
}

export function Jobs() {
  const toast = useToast();
  const [type, setType] = useState<JobType | undefined>();
  const runs = useAsync(() => get<{ items: JobRun[] }>(`/jobs/runs${qs({ type, limit: 50 })}`), [type]);
  const usage = useAsync(() => get<Usage>('/jobs/usage'), []);
  const [starting, setStarting] = useState(false);

  async function runDaily() {
    setStarting(true);
    try {
      await post('/jobs/daily-check');
      toast.success('بررسی روزانه در صف قرار گرفت. چند دقیقه بعد فهرست را تازه کنید.');
      window.setTimeout(runs.reload, 3000);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="کارها و هزینه"
        description="سابقهٔ کارهای پس‌زمینه و مصرف Apify در این ماه."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/admin/queues" target="_blank" rel="noreferrer">
                صف‌ها (Bull Board)
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
            <Button onClick={runDaily} disabled={starting}>
              {starting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
              اجرای بررسی روزانه
            </Button>
          </>
        }
      />

      <UsageCard usage={usage.data} loading={usage.loading} error={usage.error} onRetry={usage.reload} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">اجراهای اخیر</h2>
        <div className="flex gap-2">
          <Select dir="rtl" value={type ?? ALL} onValueChange={(v) => setType(v === ALL ? undefined : (v as JobType))}>
            <SelectTrigger className="w-48" aria-label="نوع کار">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>همهٔ کارها</SelectItem>
              {JOB_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {JOB_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={runs.reload} disabled={runs.loading} aria-label="تازه کردن فهرست">
            <RotateCw className={cn(runs.loading && 'animate-spin')} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Panel>
        {runs.loading && !runs.data ? (
          <LoadingRows />
        ) : runs.error ? (
          <ErrorState error={runs.error} onRetry={runs.reload} />
        ) : !runs.data?.items.length ? (
          <EmptyState title="هنوز کاری اجرا نشده" />
        ) : (
          <Table className={cn(runs.loading && 'opacity-60')}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>کار</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>شروع</TableHead>
                <TableHead>مدت</TableHead>
                <TableHead>هزینه</TableHead>
                <TableHead>نتیجه</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.data.items.map((run) => (
                <TableRow key={run._id} className="align-top hover:bg-subtle">
                  <TableCell className="font-medium text-ink">
                    {JOB_TYPE_LABELS[run.type]}
                    {run.apifyRunId && (
                      <a
                        href={`https://console.apify.com/actors/runs/${encodeURIComponent(run.apifyRunId)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-0.5 flex items-center gap-1 text-xs font-normal text-brand hover:underline"
                      >
                        اجرا در Apify
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <RunStatus run={run} />
                  </TableCell>
                  <TableCell>
                    <time dateTime={run.startedAt} title={fmtDateTime(run.startedAt)}>
                      {fmtAgo(run.startedAt)}
                    </time>
                  </TableCell>
                  <TableCell>{duration(run) ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">{money(run.costUsd)}</TableCell>
                  <TableCell className="max-w-sm whitespace-normal">
                    {run.error ? (
                      <p dir="ltr" className="text-start font-mono text-xs break-words text-danger">
                        {run.error}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        {Object.entries(run.counts ?? {}).map(([k, v]) => (
                          <span key={k}>
                            <span className="text-ink-3">{COUNT_LABELS[k] ?? k}:</span> <span className="font-medium text-ink">{num(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}

function UsageCard({ usage, loading, error, onRetry }: { usage?: Usage; loading: boolean; error: unknown; onRetry: () => void }) {
  if (loading && !usage) {
    return (
      <Panel>
        <LoadingRows rows={2} label="در حال خواندن مصرف" />
      </Panel>
    );
  }
  if (error || !usage) {
    return (
      <Panel>
        <ErrorState error={error} onRetry={onRetry} />
      </Panel>
    );
  }

  const used = usage.monthlyUsageUsd ?? usage.recordedThisMonthUsd;
  const max = usage.maxMonthlyUsageUsd ?? 5;
  const pct = Math.min(100, (used / max) * 100);
  const stopPct = Math.min(100, (usage.budgetStopUsd / max) * 100);
  const overStop = used >= usage.budgetStopUsd;
  const barTone = used >= max ? 'bg-danger-solid' : overStop ? 'bg-warn-solid' : 'bg-brand-solid';

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-ink-3">مصرف Apify در این ماه</span>
          <span className="text-3xl font-bold text-ink tabular-nums">
            {money(used)} <span className="text-base font-medium text-ink-3">از {money(max)}</span>
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <dt className="text-ink-3">ثبت‌شده در کارها</dt>
          <dd className="font-medium text-ink tabular-nums">{money(usage.recordedThisMonthUsd)}</dd>
          <dt className="text-ink-3">توقف پست‌های قبلی در</dt>
          <dd className="font-medium text-ink tabular-nums">{money(usage.budgetStopUsd)}</dd>
        </dl>
      </div>
      <div
        className="relative h-2.5 rounded-full bg-subtle"
        role="meter"
        aria-label="مصرف ماهانهٔ Apify"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={used}
        aria-valuetext={`${money(used)} از ${money(max)}`}
      >
        <div className={cn('h-full rounded-full transition-[width]', barTone)} style={{ width: `${pct}%` }} />
        <div className="absolute -top-1 h-4.5 w-0.5 rounded bg-ink-3" style={{ insetInlineStart: `${stopPct}%` }} title="حد توقف" />
      </div>
      {!usage.apifyReachable && (
        <Alert tone="note">به Apify وصل نشدیم؛ عدد بالا فقط از سابقهٔ کارهای خودمان است.</Alert>
      )}
      {overStop && (
        <Alert tone="note">مصرف از حد توقف گذشته است: دریافت پست‌های قبلی متوقف است و فقط بررسی روزانه ادامه دارد.</Alert>
      )}
    </Panel>
  );
}

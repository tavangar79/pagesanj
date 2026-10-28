// Set outcome, direction, summary; approve or reject (PRD §6.3, §9.2.1). Outcome and direction are never guessed:
// both are required before approve, and paid-partnership posts carry a visible warning.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { BadgeDollarSign, Check, ExternalLink, ImageOff, Loader2, PlayCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, EmptyState, ErrorState, Field, Handle, LoadingRows, PageHeader, Pagination, Panel, Segmented } from '@/components/common';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/toast';
import { get, post, qs } from '@/lib/api';
import { DIRECTION_LABELS, DIRECTION_TONE, OUTCOME_LABELS, errorMessage, fmtAgo, fmtDateTime, num } from '@/lib/labels';
import { DIRECTIONS, OUTCOMES, REVIEW_STATUSES, type Direction, type Outcome, type Paged, type Review, type ReviewStatus } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { cn } from '@/lib/utils';

const LIMIT = 20;
const STATUS_LABELS: Record<ReviewStatus, string> = { pending: 'در انتظار', published: 'منتشرشده', rejected: 'ردشده' };
const QUICK_REASONS = ['نقد نیست', 'تبلیغ است', 'فروشگاه اشتباه تگ شده', 'تکراری'];

export function PendingReviews() {
  const [params, setParams] = useSearchParams();
  const status = (REVIEW_STATUSES as readonly string[]).includes(params.get('status') ?? '')
    ? (params.get('status') as ReviewStatus)
    : 'pending';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const list = useAsync(() => get<Paged<Review>>(`/reviews${qs({ status, page, limit: LIMIT })}`), [status, page]);

  function setQuery(next: { status?: ReviewStatus; page?: number }) {
    const p = new URLSearchParams(params);
    if (next.status) p.set('status', next.status);
    if (next.page) p.set('page', String(next.page));
    else p.delete('page');
    setParams(p);
  }

  /** Drops a moderated review from this view without reloading the whole page. */
  function removeItem(id: string) {
    list.setData((prev) => prev && { ...prev, items: prev.items.filter((r) => r._id !== id), total: prev.total - 1 });
  }

  return (
    <>
      <PageHeader
        title="نقدهای در انتظار"
        description="پست‌های پیج‌های نقد که فروشگاهی را تگ کرده‌اند. نتیجه و جهت نقد را خودتان تعیین کنید؛ چیزی حدس زده نمی‌شود."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="وضعیت نقد"
          value={status}
          onChange={(s) => setQuery({ status: s })}
          options={REVIEW_STATUSES.map((s) => ({
            value: s,
            label: (
              <>
                {STATUS_LABELS[s]}
                {s === status && list.data && <span className="ms-1.5 text-ink-3">{num(list.data.total)}</span>}
              </>
            ),
          }))}
        />
      </div>

      {list.loading && !list.data ? (
        <Panel>
          <LoadingRows rows={4} />
        </Panel>
      ) : list.error ? (
        <Panel>
          <ErrorState error={list.error} onRetry={list.reload} />
        </Panel>
      ) : !list.data?.items.length ? (
        <Panel>
          <EmptyState title={status === 'pending' ? 'نقدی در انتظار بررسی نیست' : `نقد ${STATUS_LABELS[status]}ی نیست`}>
            {status === 'pending' && 'بررسی روزانه پست‌های تازه را می‌آورد. از صفحهٔ «کارها» می‌توانید آن را همین حالا اجرا کنید.'}
          </EmptyState>
        </Panel>
      ) : (
        <div className={cn('flex flex-col gap-4', list.loading && 'opacity-60')} aria-busy={list.loading}>
          {list.data.items.map((review) => (
            <ReviewCard key={review._id} review={review} onDone={() => removeItem(review._id)} />
          ))}
          {list.data.total > LIMIT && (
            <Panel>
              <Pagination page={page} limit={LIMIT} total={list.data.total} onPage={(p) => setQuery({ page: p })} />
            </Panel>
          )}
        </div>
      )}
    </>
  );
}

function Thumb({ review }: { review: Review }) {
  const [broken, setBroken] = useState(false);
  const src = review.media?.displayUrl;
  return (
    <a
      href={review.postUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="relative block size-28 shrink-0 overflow-hidden rounded-xl border border-line bg-subtle sm:size-32"
      aria-label="باز کردن پست در اینستاگرام"
    >
      {src && !broken ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="grid size-full place-items-center text-ink-3">
          <ImageOff className="size-6" aria-hidden="true" />
          <span className="sr-only">تصویر در دسترس نیست</span>
        </span>
      )}
      {review.media?.videoUrl && (
        <span className="absolute end-1.5 bottom-1.5 grid size-7 place-items-center rounded-full bg-ink/70 text-surface">
          <PlayCircle className="size-4" aria-hidden="true" />
          <span className="sr-only">ویدیو</span>
        </span>
      )}
    </a>
  );
}

function Target({ review }: { review: Review }) {
  if (review.shopId) {
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link to={`/shops/${review.shopId._id}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          {review.shopId.displayName}
        </Link>
        <Handle handle={review.shopId.handle} className="text-sm" />
      </span>
    );
  }
  if (review.wishlistId) {
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant="secondary">فهرست انتظار</Badge>
        <Handle handle={review.wishlistId.handle} className="text-sm" />
      </span>
    );
  }
  return <span className="text-ink-3">بدون هدف</span>;
}

function Caption({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return <p className="text-sm text-ink-3">بدون کپشن</p>;
  const long = text.length > 280 || text.split('\n').length > 4;
  return (
    <div className="flex flex-col items-start gap-1">
      <p dir="auto" className={cn('text-sm leading-7 whitespace-pre-line text-ink-2', !open && long && 'line-clamp-4')}>
        {text}
      </p>
      {long && (
        <button type="button" className="text-xs font-medium text-brand hover:underline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'نمایش کمتر' : 'نمایش کامل کپشن'}
        </button>
      )}
    </div>
  );
}

function ReviewCard({ review, onDone }: { review: Review; onDone: () => void }) {
  const toast = useToast();
  const [outcome, setOutcome] = useState<Outcome | undefined>(review.outcome);
  const [direction, setDirection] = useState<Direction | undefined>(review.direction);
  const [summary, setSummary] = useState(review.summary ?? '');
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [showMissing, setShowMissing] = useState(false);

  const isPending = review.status === 'pending';
  const onShop = Boolean(review.shopId);
  const idBase = `review-${review._id}`;

  async function approve() {
    if (!outcome || !direction) {
      setShowMissing(true);
      return;
    }
    setApproving(true);
    try {
      await post(`/reviews/${review._id}/approve`, { outcome, direction, summary: summary.trim() || null });
      toast.success('نقد منتشر شد.');
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
      setApproving(false);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      toast.error('دلیل رد را بنویسید.');
      throw new Error('reason_required');
    }
    try {
      await post(`/reviews/${review._id}/reject`, { reason: reason.trim() });
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
    toast.success(isPending ? 'نقد رد شد.' : 'نقد از انتشار خارج شد.');
    onDone();
  }

  return (
    <article
      aria-labelledby={`${idBase}-title`}
      className={cn(
        'rounded-2xl border bg-surface shadow-card',
        review.paidPartnership ? 'border-warn-line' : 'border-line',
      )}
    >
      {review.paidPartnership && (
        <div className="flex items-center gap-2 rounded-t-2xl border-b border-warn-line bg-warn-soft px-5 py-2.5 text-sm font-medium text-warn">
          <BadgeDollarSign className="size-4 shrink-0" aria-hidden="true" />
          همکاری پولی (Paid partnership): این پست تبلیغاتی است. پیش از انتشار با دقت بیشتری بررسی کنید.
        </div>
      )}
      <div className="flex flex-col gap-5 p-5 md:flex-row">
        <Thumb review={review} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id={`${idBase}-title`} className="sr-only">
                نقد {review.reviewerSourceId?.name ?? ''} دربارهٔ {review.shopId?.displayName ?? review.wishlistId?.handle ?? ''}
              </h2>
              <Target review={review} />
              <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-3">
                <span>نقد از</span>
                {review.reviewerSourceId ? (
                  <>
                    <span className="font-medium text-ink-2">{review.reviewerSourceId.name}</span>
                    <Handle handle={review.reviewerSourceId.handle} />
                  </>
                ) : (
                  <span>پیج نامعلوم</span>
                )}
                <span aria-hidden="true">·</span>
                <time dateTime={review.occurredAt} title={fmtDateTime(review.occurredAt)}>
                  {fmtAgo(review.occurredAt)}
                </time>
              </p>
            </div>
            <a
              href={review.postUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              دیدن پست
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>

          <Caption text={review.caption} />

          {isPending ? (
            <div className="flex flex-col gap-4 border-t border-line pt-4">
              {!onShop && (
                <Alert tone="note">
                  این فروشگاه هنوز در فهرست انتظار است. برای انتشار، اول در{' '}
                  <Link to="/wishlist" className="font-semibold underline underline-offset-4">
                    فهرست انتظار
                  </Link>{' '}
                  آن را به فروشگاه تبدیل یا به فروشگاهی وصل کنید. رد کردن همین حالا هم ممکن است.
                </Alert>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label={
                    <>
                      نتیجه برای خریدار <span className="text-danger">*</span>
                    </>
                  }
                  htmlFor={`${idBase}-outcome`}
                  error={showMissing && !outcome ? 'نتیجه را انتخاب کنید.' : null}
                >
                  <Select dir="rtl" value={outcome} onValueChange={(v) => setOutcome(v as Outcome)}>
                    <SelectTrigger id={`${idBase}-outcome`} className="w-full" aria-required="true">
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTCOMES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {OUTCOME_LABELS[o]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex flex-col gap-1.5">
                  <span id={`${idBase}-direction`} className="text-sm font-medium text-ink-2">
                    جهت نقد <span className="text-danger">*</span>
                  </span>
                  <Segmented
                    label="جهت نقد"
                    value={direction}
                    onChange={setDirection}
                    options={DIRECTIONS.map((d) => ({ value: d, label: DIRECTION_LABELS[d] }))}
                  />
                  {showMissing && !direction && (
                    <p role="alert" className="text-xs text-danger">
                      جهت نقد را انتخاب کنید.
                    </p>
                  )}
                </div>
              </div>
              <Field label="خلاصهٔ یک‌خطی (اختیاری)" htmlFor={`${idBase}-summary`} hint="در پاسخ دایرکت نشان داده می‌شود. حداکثر ۲۰۰ نویسه.">
                <Input id={`${idBase}-summary`} maxLength={200} value={summary} onChange={(e) => setSummary(e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button onClick={approve} disabled={approving || !onShop}>
                  {approving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                  تأیید و انتشار
                </Button>
                <Button variant="outline" className="text-danger" onClick={() => setRejectOpen(true)} disabled={approving}>
                  <X aria-hidden="true" />
                  رد کردن
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
              {review.status === 'published' ? (
                <>
                  {review.outcome && <Badge variant="secondary">{OUTCOME_LABELS[review.outcome]}</Badge>}
                  {review.direction && <Badge variant={DIRECTION_TONE[review.direction]}>{DIRECTION_LABELS[review.direction]}</Badge>}
                  {review.summary && <span className="text-ink-2">«{review.summary}»</span>}
                  <span className="text-xs text-ink-3">منتشرشده {fmtAgo(review.publishedAt)}</span>
                  <Button variant="outline" size="sm" className="ms-auto text-danger" onClick={() => setRejectOpen(true)}>
                    خارج کردن از انتشار
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="danger">ردشده</Badge>
                  <span className="text-ink-2">{review.rejectReason}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={(o) => {
          setRejectOpen(o);
          if (!o) setReason('');
        }}
        title={isPending ? 'رد کردن این نقد؟' : 'خارج کردن این نقد از انتشار؟'}
        description="نقد ردشده در پاسخ‌های دایرکت نمی‌آید. دلیل را برای سابقه بنویسید."
        confirmLabel={isPending ? 'رد کن' : 'از انتشار خارج کن'}
        onConfirm={reject}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" aria-label="دلیل‌های پرتکرار">
            {QUICK_REASONS.map((r) => (
              <Button key={r} type="button" variant="outline" size="xs" onClick={() => setReason(r)} aria-pressed={reason === r}>
                {r}
              </Button>
            ))}
          </div>
          <Field label="دلیل رد" htmlFor={`${idBase}-reason`}>
            <Textarea id={`${idBase}-reason`} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </ConfirmDialog>
    </article>
  );
}

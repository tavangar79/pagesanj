// Sorted by requestCount; promote to shop, link to an existing shop, dismiss (PRD §9.2.2).
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowUpRight, Link2, Loader2, Search, Store, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, Handle, LoadingRows, PageHeader, Pagination, Panel, Segmented } from '@/components/common';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/toast';
import { get, post, qs } from '@/lib/api';
import { WISHLIST_SOURCE_LABELS, errorMessage, fmtAgo, fmtDateTime, num } from '@/lib/labels';
import { WISHLIST_STATUSES, type Paged, type Shop, type WishlistEntry, type WishlistStatus } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { cn } from '@/lib/utils';

const LIMIT = 25;
const STATUS_LABELS: Record<WishlistStatus, string> = { open: 'باز', promoted: 'تبدیل‌شده', dismissed: 'کنارگذاشته' };

export function Wishlist() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const status = (WISHLIST_STATUSES as readonly string[]).includes(params.get('status') ?? '')
    ? (params.get('status') as WishlistStatus)
    : 'open';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const list = useAsync(() => get<Paged<WishlistEntry>>(`/wishlist${qs({ status, page, limit: LIMIT })}`), [status, page]);
  const [linking, setLinking] = useState<WishlistEntry | null>(null);
  const [dismissing, setDismissing] = useState<WishlistEntry | null>(null);

  function setQuery(next: { status?: WishlistStatus; page?: number }) {
    const p = new URLSearchParams(params);
    if (next.status) p.set('status', next.status);
    if (next.page) p.set('page', String(next.page));
    else p.delete('page');
    setParams(p);
  }

  function removeItem(id: string) {
    list.setData((prev) => prev && { ...prev, items: prev.items.filter((e) => e._id !== id), total: prev.total - 1 });
  }

  async function dismiss() {
    if (!dismissing) return;
    try {
      await post(`/wishlist/${dismissing._id}/dismiss`);
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
    toast.success(`@${dismissing.handle} کنار گذاشته شد.`);
    removeItem(dismissing._id);
  }

  return (
    <>
      <PageHeader
        title="فهرست انتظار"
        description="پیج‌هایی که مردم دربارهٔ آن‌ها پرسیده‌اند یا پیج‌های نقد تگشان کرده‌اند، به ترتیب تقاضا."
      />
      <Segmented
        label="وضعیت"
        value={status}
        onChange={(s) => setQuery({ status: s })}
        options={WISHLIST_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
      />

      <Panel>
        {list.loading && !list.data ? (
          <LoadingRows />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState title="فهرست خالی است">
            {status === 'open' && 'وقتی کسی در دایرکت دربارهٔ پیجی بپرسد که هنوز نقد نشده، اینجا می‌آید.'}
          </EmptyState>
        ) : (
          <div className={cn(list.loading && 'opacity-60')} aria-busy={list.loading}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>پیج</TableHead>
                  <TableHead>درخواست</TableHead>
                  <TableHead>منبع</TableHead>
                  <TableHead>نقد در انتظار</TableHead>
                  <TableHead>آخرین درخواست</TableHead>
                  {status === 'open' && <TableHead className="text-end">اقدام</TableHead>}
                  {status === 'promoted' && <TableHead className="text-end">فروشگاه</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((entry) => (
                  <TableRow key={entry._id} className="hover:bg-subtle">
                    <TableCell>
                      <Handle handle={entry.handle} />
                    </TableCell>
                    <TableCell className="font-semibold text-ink tabular-nums">{num(entry.requestCount)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {entry.sources.map((s) => (
                          <Badge key={s} variant="secondary">
                            {WISHLIST_SOURCE_LABELS[s]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {entry.pendingReviews > 0 ? (
                        <Badge variant="default">{num(entry.pendingReviews)} نقد</Badge>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <time dateTime={entry.lastRequestedAt} title={fmtDateTime(entry.lastRequestedAt)}>
                        {fmtAgo(entry.lastRequestedAt)}
                      </time>
                    </TableCell>
                    {status === 'open' && (
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/shops/new${qs({ wishlist: entry._id, handle: entry.handle })}`)}
                          >
                            <Store aria-hidden="true" />
                            ساخت فروشگاه
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setLinking(entry)}>
                            <Link2 aria-hidden="true" />
                            وصل به فروشگاه
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-danger"
                            onClick={() => setDismissing(entry)}
                            aria-label={`کنار گذاشتن @${entry.handle}`}
                          >
                            <X aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    {status === 'promoted' && (
                      <TableCell className="text-end">
                        {entry.promotedShopId && (
                          <Link
                            to={`/shops/${entry.promotedShopId}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                          >
                            باز کردن
                            <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
                          </Link>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} limit={LIMIT} total={list.data.total} onPage={(p) => setQuery({ page: p })} />
          </div>
        )}
      </Panel>

      <LinkDialog
        entry={linking}
        onClose={() => setLinking(null)}
        onLinked={(entry) => {
          removeItem(entry._id);
          setLinking(null);
        }}
      />
      <ConfirmDialog
        open={dismissing !== null}
        onOpenChange={(o) => !o && setDismissing(null)}
        title={`کنار گذاشتن @${dismissing?.handle ?? ''}؟`}
        description={
          dismissing?.pendingReviews
            ? `${num(dismissing.pendingReviews)} نقد در انتظار به این مورد وصل است و منتشر نمی‌شود. اگر دوباره درخواست شود، شمارش ادامه پیدا می‌کند.`
            : 'این پیج نقد نمی‌شود. اگر دوباره درخواست شود، شمارش ادامه پیدا می‌کند.'
        }
        confirmLabel="کنار بگذار"
        onConfirm={dismiss}
      />
    </>
  );
}

/** Pick an existing shop (e.g. after a rename); the entry's handle joins its previous handles. */
function LinkDialog({
  entry,
  onClose,
  onLinked,
}: {
  entry: WishlistEntry | null;
  onClose: () => void;
  onLinked: (entry: WishlistEntry) => void;
}) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const results = useAsync(
    () => (entry ? get<Paged<Shop>>(`/shops${qs({ q: query, limit: 8 })}`) : Promise.resolve(undefined)),
    [entry?._id, query],
  );

  async function link(shop: Shop) {
    if (!entry) return;
    setPendingId(shop._id);
    try {
      const res = await post<{ reviews: { moved: number; duplicates: number } }>(`/wishlist/${entry._id}/link`, { shopId: shop._id });
      toast.success(`@${entry.handle} به «${shop.displayName}» وصل شد. ${num(res.reviews.moved)} نقد منتقل شد.`);
      onLinked(entry);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(o) => {
        if (!o && !pendingId) {
          onClose();
          setQ('');
          setQuery('');
        }
      }}
    >
      <DialogContent dir="rtl" className="gap-4">
        <DialogHeader className="text-start">
          <DialogTitle className="text-ink">وصل کردن به فروشگاه موجود</DialogTitle>
          <DialogDescription className="leading-6 text-ink-3">
            مثلاً وقتی فروشگاه شناسه‌اش را عوض کرده است. <Handle handle={entry?.handle ?? ''} link={false} /> به شناسه‌های قبلی
            فروشگاه اضافه می‌شود و نقدهای در انتظارش منتقل می‌شوند.
          </DialogDescription>
        </DialogHeader>
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
          }}
        >
          <label htmlFor="link-shop-q" className="sr-only">
            جست‌وجوی فروشگاه
          </label>
          <Input id="link-shop-q" placeholder="نام یا شناسهٔ فروشگاه" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <Button type="submit" variant="outline" size="icon" aria-label="جست‌وجو">
            <Search aria-hidden="true" />
          </Button>
        </form>
        <div className="max-h-80 overflow-y-auto rounded-xl border border-line">
          {results.loading ? (
            <LoadingRows rows={3} />
          ) : results.error ? (
            <ErrorState error={results.error} onRetry={results.reload} />
          ) : !results.data?.items.length ? (
            <EmptyState title="فروشگاهی پیدا نشد" />
          ) : (
            <ul className="divide-y divide-line">
              {results.data.items.map((shop) => (
                <li key={shop._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={`/media/shop/${shop.profileImage.sha256}`} alt="" className="size-9 shrink-0 rounded-full border border-line object-cover" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-ink">{shop.displayName}</span>
                      <Handle handle={shop.handle} link={false} className="text-xs text-ink-3" />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" disabled={pendingId !== null} onClick={() => link(shop)}>
                    {pendingId === shop._id && <Loader2 className="animate-spin" aria-hidden="true" />}
                    انتخاب
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

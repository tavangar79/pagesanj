// Shop list with search and filters (PRD §9.2.3).
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, Handle, LoadingRows, PageHeader, Pagination, Panel } from '@/components/common';
import { get, qs } from '@/lib/api';
import { SHOP_STATUS_LABELS, SHOP_STATUS_TONE, fmtAgo, fmtDateTime } from '@/lib/labels';
import { SHOP_STATUSES, type Category, type Paged, type Shop, type ShopStatus } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { cn } from '@/lib/utils';

const LIMIT = 25;
const ALL = '__all';

export function Shops() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const status = (SHOP_STATUSES as readonly string[]).includes(params.get('status') ?? '') ? (params.get('status') as ShopStatus) : undefined;
  const categoryId = params.get('category') ?? undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(q);

  const list = useAsync(
    () => get<Paged<Shop>>(`/shops${qs({ q, status, categoryId, page, limit: LIMIT })}`),
    [q, status, categoryId, page],
  );
  const categories = useAsync(() => get<{ items: Category[] }>('/categories'), []);
  const categoryName = new Map(categories.data?.items.map((c) => [c._id, c.name]));

  function setQuery(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (!('page' in next)) p.delete('page');
    setParams(p);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setQuery({ q: search.trim() || undefined });
  }

  const filtered = Boolean(q || status || categoryId);

  return (
    <>
      <PageHeader
        title="فروشگاه‌ها"
        description="پاسخ ربات از همین فهرست می‌آید."
        actions={
          <Button asChild>
            <Link to="/shops/new">
              <Plus aria-hidden="true" />
              فروشگاه تازه
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form role="search" onSubmit={onSearch} className="flex flex-1 gap-2">
          <label htmlFor="shop-q" className="sr-only">
            جست‌وجو در نام یا شناسه
          </label>
          <Input id="shop-q" placeholder="نام یا شناسهٔ فروشگاه" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="submit" variant="outline">
            <Search aria-hidden="true" />
            جست‌وجو
          </Button>
        </form>
        <div className="flex gap-2">
          <Select dir="rtl" value={status ?? ALL} onValueChange={(v) => setQuery({ status: v === ALL ? undefined : v })}>
            <SelectTrigger className="w-full md:w-48" aria-label="فیلتر وضعیت">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>همهٔ وضعیت‌ها</SelectItem>
              {SHOP_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SHOP_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select dir="rtl" value={categoryId ?? ALL} onValueChange={(v) => setQuery({ category: v === ALL ? undefined : v })}>
            <SelectTrigger className="w-full md:w-44" aria-label="فیلتر دسته‌بندی">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>همهٔ دسته‌ها</SelectItem>
              {categories.data?.items.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Panel>
        {list.loading && !list.data ? (
          <LoadingRows />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          filtered ? (
            <EmptyState title="فروشگاهی با این فیلترها نیست">
              <Button
                variant="link"
                onClick={() => {
                  setSearch('');
                  setParams(new URLSearchParams());
                }}
              >
                پاک کردن فیلترها
              </Button>
            </EmptyState>
          ) : (
            <EmptyState title="هنوز فروشگاهی ثبت نشده">
              از «فروشگاه تازه» یا از فهرست انتظار شروع کنید.
            </EmptyState>
          )
        ) : (
          <div className={cn(list.loading && 'opacity-60')} aria-busy={list.loading}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>فروشگاه</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>دسته‌ها</TableHead>
                  <TableHead>برچسب‌ها</TableHead>
                  <TableHead>آخرین ویرایش</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((shop) => (
                  <TableRow key={shop._id} className="hover:bg-subtle">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={`/media/shop/${shop.profileImage.sha256}`}
                          alt=""
                          loading="lazy"
                          className="size-10 shrink-0 rounded-full border border-line object-cover"
                        />
                        <div className="flex min-w-0 flex-col">
                          <Link to={`/shops/${shop._id}`} className="font-semibold text-ink underline-offset-4 hover:underline">
                            {shop.displayName}
                          </Link>
                          <Handle handle={shop.handle} className="text-xs" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={SHOP_STATUS_TONE[shop.status]}>{SHOP_STATUS_LABELS[shop.status]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {shop.categoryIds.length ? (
                        shop.categoryIds.map((id) => categoryName.get(id) ?? '…').join('، ')
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {shop.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                        {shop.tags.length > 3 && <span className="text-xs text-ink-3">+{shop.tags.length - 3}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <time dateTime={shop.updatedAt} title={fmtDateTime(shop.updatedAt)}>
                        {fmtAgo(shop.updatedAt)}
                      </time>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} limit={LIMIT} total={list.data.total} onPage={(p) => setQuery({ page: String(p) })} />
          </div>
        )}
      </Panel>
    </>
  );
}

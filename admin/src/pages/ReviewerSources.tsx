// Add/edit sources, follow toggle, backfill limit, run backfill now (PRD §6.1, §9.2.5).
import { useState, type FormEvent } from 'react';
import { History, Loader2, Pencil, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, Field, Handle, LoadingRows, PageHeader, Panel } from '@/components/common';
import { normalizeHandle } from '@/components/TagInput';
import { useToast } from '@/components/toast';
import { get, patch, post } from '@/lib/api';
import { PERMISSION_LABELS, errorMessage, fmtAgo, fmtDateTime, num } from '@/lib/labels';
import { REVIEWER_PERMISSIONS, type ReviewerPermission, type ReviewerSource } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

export function ReviewerSources() {
  const toast = useToast();
  const list = useAsync(() => get<{ items: ReviewerSource[] }>('/reviewer-sources'), []);
  const [editing, setEditing] = useState<ReviewerSource | 'new' | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  function replace(updated: ReviewerSource) {
    list.setData((prev) => prev && { items: prev.items.map((s) => (s._id === updated._id ? updated : s)) });
  }

  async function toggleFollow(source: ReviewerSource, follow: boolean) {
    setPending(`follow-${source._id}`);
    try {
      replace(await patch<ReviewerSource>(`/reviewer-sources/${source._id}`, { follow }));
      toast.success(follow ? `@${source.handle} در بررسی روزانه است.` : `@${source.handle} از بررسی روزانه خارج شد.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  async function backfill(source: ReviewerSource) {
    setPending(`backfill-${source._id}`);
    try {
      await post(`/reviewer-sources/${source._id}/backfill`);
      toast.success(`دریافت تا ${num(source.backfillLimit)} پست قبلی @${source.handle} در صف قرار گرفت. نتیجه در «کارها».`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <PageHeader
        title="پیج‌های نقد"
        description="پیج‌هایی که هر روز ساعت ۹ صبح (تهران) برای پست تازه بررسی می‌شوند."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" />
            افزودن پیج
          </Button>
        }
      />

      <Panel>
        {list.loading && !list.data ? (
          <LoadingRows />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState title="هنوز پیج نقدی اضافه نشده">
            مثلاً <Handle handle="sadegh.delicious" link={false} /> را اضافه کنید؛ پست‌های قبلی‌اش یک بار دریافت می‌شود.
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>پیج</TableHead>
                <TableHead>دنبال‌کردن</TableHead>
                <TableHead>پست‌های قبلی</TableHead>
                <TableHead>آخرین پست دیده‌شده</TableHead>
                <TableHead>اجازهٔ نمایش</TableHead>
                <TableHead className="text-end">اقدام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.items.map((s) => (
                <TableRow key={s._id} className="hover:bg-subtle">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink">{s.name}</span>
                      <Handle handle={s.handle} className="text-xs" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={s.follow}
                        disabled={pending === `follow-${s._id}`}
                        onCheckedChange={(v) => toggleFollow(s, v)}
                        aria-label={`دنبال‌کردن @${s.handle}`}
                      />
                      <span className="text-xs text-ink-3">{s.follow ? 'روشن' : 'خاموش'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.backfillDone ? (
                      <Badge variant="success">انجام شد</Badge>
                    ) : (
                      <Badge variant="caution">انجام نشده</Badge>
                    )}
                    <span className="ms-2 text-xs text-ink-3">سقف {num(s.backfillLimit)}</span>
                  </TableCell>
                  <TableCell>
                    {s.lastSeenPostAt ? (
                      <div className="flex flex-col">
                        <time dateTime={s.lastSeenPostAt} title={fmtDateTime(s.lastSeenPostAt)}>
                          {fmtAgo(s.lastSeenPostAt)}
                        </time>
                        {s.lastSeenShortcode && (
                          <a
                            href={`https://www.instagram.com/p/${s.lastSeenShortcode}/`}
                            target="_blank"
                            rel="noreferrer noopener"
                            dir="ltr"
                            className="text-start text-xs text-brand hover:underline"
                          >
                            {s.lastSeenShortcode}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </TableCell>
                  <TableCell>{PERMISSION_LABELS[s.permission]}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" disabled={pending === `backfill-${s._id}`} onClick={() => backfill(s)}>
                        {pending === `backfill-${s._id}` ? <Loader2 className="animate-spin" aria-hidden="true" /> : <History aria-hidden="true" />}
                        دریافت پست‌های قبلی
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditing(s)} aria-label={`ویرایش @${s.handle}`}>
                        <Pencil aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <SourceDialog
        source={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved, created) => {
          if (created) list.setData((prev) => prev && { items: [...prev.items, saved] });
          else replace(saved);
          setEditing(null);
        }}
      />
    </>
  );
}

function SourceDialog({
  source,
  onClose,
  onSaved,
}: {
  source: ReviewerSource | 'new' | null;
  onClose: () => void;
  onSaved: (s: ReviewerSource, created: boolean) => void;
}) {
  const toast = useToast();
  const isNew = source === 'new';
  const key = source === null ? null : isNew ? 'new' : source._id;
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [follow, setFollow] = useState(true);
  const [limit, setLimit] = useState('50');
  const [permission, setPermission] = useState<ReviewerPermission>('link_only');
  const [pending, setPending] = useState(false);

  if (key && openFor !== key) {
    setOpenFor(key);
    const s = isNew ? null : (source as ReviewerSource);
    setHandle(s?.handle ?? '');
    setName(s?.name ?? '');
    setFollow(s?.follow ?? true);
    setLimit(String(s?.backfillLimit ?? 50));
    setPermission(s?.permission ?? 'link_only');
  }

  const limitNumber = Number(limit);
  const limitValid = Number.isInteger(limitNumber) && limitNumber >= 0 && limitNumber <= 500;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !limitValid || (isNew && !normalizeHandle(handle))) return;
    setPending(true);
    try {
      const body = { name: name.trim(), follow, backfillLimit: limitNumber, permission };
      const saved = isNew
        ? await post<ReviewerSource>('/reviewer-sources', { ...body, handle: normalizeHandle(handle) })
        : await patch<ReviewerSource>(`/reviewer-sources/${(source as ReviewerSource)._id}`, body);
      toast.success(isNew ? 'پیج اضافه شد. دریافت پست‌های قبلی در صف است.' : 'تغییرات ذخیره شد.');
      onSaved(saved, isNew);
      setOpenFor(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={source !== null}
      onOpenChange={(o) => {
        if (!o && !pending) {
          onClose();
          setOpenFor(null);
        }
      }}
    >
      <DialogContent dir="rtl">
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader className="text-start">
            <DialogTitle className="text-ink">{isNew ? 'افزودن پیج نقد' : 'ویرایش پیج نقد'}</DialogTitle>
            <DialogDescription className="leading-6 text-ink-3">
              هزینهٔ اصلی Apify دریافت پست‌های قبلی است؛ سقف را معقول نگه دارید (پیش‌فرض ۵۰).
            </DialogDescription>
          </DialogHeader>
          {isNew ? (
            <Field label="شناسهٔ اینستاگرام" htmlFor="src-handle">
              <Input
                id="src-handle"
                dir="ltr"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="reviewer.page"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onBlur={() => setHandle(normalizeHandle(handle))}
              />
            </Field>
          ) : (
            <p className="text-sm text-ink-2">
              پیج: <Handle handle={(source as ReviewerSource).handle} />
            </p>
          )}
          <Field label="نام نمایشی" htmlFor="src-name">
            <Input id="src-name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="سقف پست‌های قبلی" htmlFor="src-limit" error={limitValid ? null : 'عددی بین ۰ تا ۵۰۰'}>
              <Input
                id="src-limit"
                type="number"
                inputMode="numeric"
                dir="ltr"
                min={0}
                max={500}
                value={limit}
                aria-invalid={!limitValid}
                onChange={(e) => setLimit(e.target.value)}
              />
            </Field>
            <Field label="اجازهٔ نمایش" htmlFor="src-permission">
              <Select dir="rtl" value={permission} onValueChange={(v) => setPermission(v as ReviewerPermission)}>
                <SelectTrigger id="src-permission" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEWER_PERMISSIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERMISSION_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-sm text-ink-2">
            در بررسی روزانه باشد
            <Switch checked={follow} onCheckedChange={setFollow} />
          </label>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" disabled={pending || !name.trim() || !limitValid || (isNew && !normalizeHandle(handle))}>
              {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isNew ? 'افزودن' : 'ذخیره'}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              انصراف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

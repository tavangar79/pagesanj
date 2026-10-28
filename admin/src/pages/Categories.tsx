// Add, rename, delete categories with shop counts (PRD §8, §9.2.4). A category in use can't be deleted.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, Field, LoadingRows, PageHeader, Panel } from '@/components/common';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/toast';
import { del, get, patch, post } from '@/lib/api';
import { errorMessage, num } from '@/lib/labels';
import type { Category } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

export function Categories() {
  const toast = useToast();
  const list = useAsync(() => get<{ items: Category[] }>('/categories'), []);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const created = await post<Category>('/categories', { name: name.trim(), nameEn: nameEn.trim() || null });
      list.setData((prev) => prev && { items: [...prev.items, { ...created, shopCount: 0 }] });
      setName('');
      setNameEn('');
      toast.success(`«${created.name}» اضافه شد.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await del(`/categories/${deleting._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
    list.setData((prev) => prev && { items: prev.items.filter((c) => c._id !== deleting._id) });
    toast.success(`«${deleting.name}» حذف شد.`);
  }

  return (
    <>
      <PageHeader title="دسته‌بندی‌ها" description="فهرست ثابتی که برای فروشگاه‌ها انتخاب می‌شود. نام‌های هم‌معنا با املای متفاوت دوبار ثبت نمی‌شوند." />

      <Panel className="p-5">
        <form onSubmit={add} className="flex flex-col gap-3 md:flex-row md:items-end">
          <Field label="نام فارسی" htmlFor="cat-name" className="flex-1">
            <Input id="cat-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً پوشاک" />
          </Field>
          <Field label="نام انگلیسی (اختیاری)" htmlFor="cat-name-en" className="flex-1">
            <Input id="cat-name-en" dir="ltr" maxLength={80} value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Clothing" />
          </Field>
          <Button type="submit" disabled={adding || !name.trim()}>
            {adding ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
            افزودن
          </Button>
        </form>
      </Panel>

      <Panel>
        {list.loading && !list.data ? (
          <LoadingRows />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState title="هنوز دسته‌بندی‌ای نیست">اولین دسته‌بندی را از فرم بالا اضافه کنید.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>نام</TableHead>
                <TableHead>نام انگلیسی</TableHead>
                <TableHead>شناسهٔ نشانی</TableHead>
                <TableHead>فروشگاه‌ها</TableHead>
                <TableHead className="text-end">اقدام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.items.map((c) => (
                <TableRow key={c._id} className="hover:bg-subtle">
                  <TableCell className="font-semibold text-ink">{c.name}</TableCell>
                  <TableCell>{c.nameEn ? <span dir="ltr">{c.nameEn}</span> : <span className="text-ink-3">—</span>}</TableCell>
                  <TableCell>
                    <code dir="ltr" className="text-xs text-ink-3">
                      {c.slug}
                    </code>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {c.shopCount > 0 ? (
                      <Link to={`/shops?category=${c._id}`} className="font-medium text-brand hover:underline">
                        {num(c.shopCount)}
                      </Link>
                    ) : (
                      num(0)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)} aria-label={`ویرایش ${c.name}`}>
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-danger"
                        disabled={c.shopCount > 0}
                        title={c.shopCount > 0 ? 'اول فروشگاه‌های این دسته را جابه‌جا کنید' : undefined}
                        onClick={() => setDeleting(c)}
                        aria-label={`حذف ${c.name}`}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <RenameDialog
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          list.setData((prev) => prev && { items: prev.items.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)) });
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`حذف «${deleting?.name ?? ''}»؟`}
        description="این کار برگشت‌پذیر نیست."
        confirmLabel="حذف کن"
        onConfirm={remove}
      />
    </>
  );
}

function RenameDialog({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: (c: Category) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [pending, setPending] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);

  if (category && openFor !== category._id) {
    setOpenFor(category._id);
    setName(category.name);
    setNameEn(category.nameEn ?? '');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!category || !name.trim()) return;
    setPending(true);
    try {
      const updated = await patch<Category>(`/categories/${category._id}`, { name: name.trim(), nameEn: nameEn.trim() || null });
      toast.success('دسته‌بندی به‌روز شد.');
      onSaved(updated);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={category !== null}
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
            <DialogTitle className="text-ink">ویرایش دسته‌بندی</DialogTitle>
            <DialogDescription className="text-ink-3">شناسهٔ نشانی (slug) تغییر نمی‌کند تا پیوندها نشکنند.</DialogDescription>
          </DialogHeader>
          <Field label="نام فارسی" htmlFor="cat-edit-name">
            <Input id="cat-edit-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="نام انگلیسی" htmlFor="cat-edit-name-en">
            <Input id="cat-edit-name-en" dir="ltr" maxLength={80} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </Field>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
              ذخیره
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

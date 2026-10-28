// Create/edit a shop, profile image, contact, refresh profile (PRD §5.6, §9.2.3). A new shop (also one promoted
// from the wishlist) starts with the profile fetch; the admin checks the result before saving. The image is required,
// and contact fields stay empty unless the shop's own page shows them.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowRight, Download, ImageUp, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, EmptyState, ErrorState, Field, Handle, LoadingRows, PageHeader, Panel } from '@/components/common';
import { TagInput, normalizeHandle } from '@/components/TagInput';
import { useToast } from '@/components/toast';
import { ApiError, get, patch, post, uploadImage } from '@/lib/api';
import { SHOP_STATUS_LABELS, errorMessage, fmtDateTime } from '@/lib/labels';
import { useProfileJob } from '@/lib/profileJob';
import { SHOP_STATUSES, type Category, type ProfileDraft, type Shop, type ShopStatus, type StoredImage } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Form = {
  handle: string;
  displayName: string;
  previousHandles: string[];
  status: ShopStatus;
  tags: string[];
  categoryIds: string[];
  bio: string;
  image: (StoredImage & { url: string }) | null;
  email: string;
  website: string;
  phone: string;
  profileFetchedAt?: string;
};

const EMPTY: Form = {
  handle: '',
  displayName: '',
  previousHandles: [],
  status: 'no_known_issues',
  tags: [],
  categoryIds: [],
  bio: '',
  image: null,
  email: '',
  website: '',
  phone: '',
};

function fromShop(shop: Shop): Form {
  return {
    handle: shop.handle,
    displayName: shop.displayName,
    previousHandles: shop.previousHandles,
    status: shop.status,
    tags: shop.tags,
    categoryIds: shop.categoryIds.map(String),
    bio: shop.bio ?? '',
    image: { ...shop.profileImage, url: `/media/shop/${shop.profileImage.sha256}` },
    email: shop.contact?.email ?? '',
    website: shop.contact?.website ?? '',
    phone: shop.contact?.phone ?? '',
    profileFetchedAt: shop.profileFetchedAt,
  };
}

export function ShopEdit() {
  const { id } = useParams();
  const isNew = !id;
  const shop = useAsync(() => (id ? get<Shop>(`/shops/${id}`) : Promise.resolve(undefined)), [id]);

  if (!isNew && shop.loading && !shop.data) {
    return (
      <>
        <BackLink />
        <Panel>
          <LoadingRows rows={6} />
        </Panel>
      </>
    );
  }
  if (!isNew && shop.error) {
    return (
      <>
        <BackLink />
        <Panel>
          {shop.error instanceof ApiError && shop.error.status === 404 ? (
            <EmptyState title="این فروشگاه پیدا نشد" />
          ) : (
            <ErrorState error={shop.error} onRetry={shop.reload} />
          )}
        </Panel>
      </>
    );
  }
  return <ShopForm key={id ?? 'new'} shop={shop.data} onRefreshed={shop.reload} />;
}

function BackLink() {
  return (
    <Link to="/shops" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink-3 hover:text-ink">
      <ArrowRight className="size-4" aria-hidden="true" />
      فروشگاه‌ها
    </Link>
  );
}

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {description && <p className="text-sm leading-6 text-ink-3">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function ShopForm({ shop, onRefreshed }: { shop?: Shop; onRefreshed: () => void }) {
  const isNew = !shop;
  const [params] = useSearchParams();
  const wishlistId = isNew ? params.get('wishlist') : null;
  const navigate = useNavigate();
  const toast = useToast();
  const categories = useAsync(() => get<{ items: Category[] }>('/categories'), []);
  const profile = useProfileJob();
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>(() =>
    shop ? fromShop(shop) : { ...EMPTY, handle: normalizeHandle(params.get('handle') ?? '') },
  );
  const [fetched, setFetched] = useState<ProfileDraft | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | 'form', string>>>({});

  useEffect(() => {
    if (shop) setForm(fromShop(shop));
  }, [shop]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** New shop: read the profile and fill the form; the admin reviews before saving. */
  async function fetchProfile() {
    const handle = normalizeHandle(form.handle);
    if (!handle) {
      setErrors((e) => ({ ...e, handle: 'شناسه را وارد کنید.' }));
      return;
    }
    setFetchError(null);
    profile.setRunning(true);
    try {
      const { jobId } = await post<{ jobId: string }>('/shops/profile-preview', { handle });
      const draft = await profile.wait(jobId);
      setFetched(draft);
      setForm((f) => ({
        ...f,
        handle: draft.handle,
        displayName: f.displayName || draft.displayName || '',
        image: draft.image ?? f.image,
        email: draft.contact.email ?? '',
        website: draft.contact.website ?? '',
        phone: draft.contact.phone ?? '',
        profileFetchedAt: draft.fetchedAt,
      }));
      toast.success('پروفایل خوانده شد. اطلاعات را بررسی کنید.');
    } catch (err) {
      profile.setRunning(false);
      setFetchError(err instanceof ApiError ? errorMessage(err) : (err as Error).message);
    }
  }

  /** Existing shop: the worker applies the result to the shop itself; then reload it. */
  async function refreshProfile() {
    if (!shop) return;
    setFetchError(null);
    profile.setRunning(true);
    try {
      const { jobId } = await post<{ jobId: string }>(`/shops/${shop._id}/refresh-profile`);
      const draft = await profile.wait(jobId);
      setFetched(draft);
      toast.success(draft.image ? 'پروفایل و تصویر به‌روز شد.' : 'اطلاعات تماس به‌روز شد؛ تصویر تازه‌ای گرفته نشد.');
      onRefreshed();
    } catch (err) {
      profile.setRunning(false);
      setFetchError(err instanceof ApiError ? errorMessage(err) : (err as Error).message);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('فقط JPEG، PNG یا WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('حجم تصویر باید حداکثر ۲ مگابایت باشد.');
      return;
    }
    setUploading(true);
    try {
      const image = await uploadImage<StoredImage & { url: string }>(file);
      set('image', image);
      toast.success('تصویر بارگذاری شد. برای ثبت، فرم را ذخیره کنید.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function validate() {
    const next: typeof errors = {};
    if (!normalizeHandle(form.handle)) next.handle = 'شناسه را وارد کنید.';
    if (!form.displayName.trim()) next.displayName = 'نام فروشگاه را وارد کنید.';
    if (!form.image) next.image = 'تصویر پروفایل لازم است. از اینستاگرام بخوانید یا بارگذاری کنید.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'ایمیل معتبر نیست.';
    if (form.website && !/^https?:\/\/\S+$/i.test(form.website.trim())) next.website = 'نشانی کامل با https:// بنویسید.';
    if (form.phone && !/^\+?[\d\s-]{6,20}$/.test(form.phone.trim())) next.phone = 'شماره را به شکل بین‌المللی بنویسید (+98…).';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error('چند فیلد نیاز به اصلاح دارد.');
      return;
    }
    const body = {
      displayName: form.displayName.trim(),
      previousHandles: form.previousHandles,
      status: form.status,
      tags: form.tags,
      categoryIds: form.categoryIds,
      bio: form.bio.trim() || null,
      profileImageId: form.image!.imageId,
      contact: { email: form.email.trim() || null, website: form.website.trim() || null, phone: form.phone.trim() || null },
    };
    setSaving(true);
    try {
      if (shop) {
        await patch<Shop>(`/shops/${shop._id}`, { ...body, handle: normalizeHandle(form.handle) });
        toast.success('تغییرات ذخیره شد.');
        onRefreshed();
      } else if (wishlistId) {
        const res = await post<{ shop: Shop; reviews: { moved: number } }>(`/wishlist/${wishlistId}/promote`, {
          ...body,
          ...(form.profileFetchedAt && { profileFetchedAt: form.profileFetchedAt }),
        });
        toast.success(`فروشگاه ساخته شد و ${new Intl.NumberFormat('fa-IR').format(res.reviews.moved)} نقد به آن منتقل شد.`);
        navigate(`/shops/${res.shop._id}`, { replace: true });
      } else {
        const created = await post<Shop>('/shops', {
          ...body,
          handle: normalizeHandle(form.handle),
          ...(form.profileFetchedAt && { profileFetchedAt: form.profileFetchedAt }),
        });
        toast.success('فروشگاه ساخته شد.');
        navigate(`/shops/${created._id}`, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'handle_in_use') setErrors((x) => ({ ...x, handle: errorMessage(err) }));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploading || profile.running;
  const title = shop ? shop.displayName : wishlistId ? 'ساخت فروشگاه از فهرست انتظار' : 'فروشگاه تازه';

  return (
    <>
      <BackLink />
      <PageHeader
        title={title}
        description={shop ? <Handle handle={shop.handle} /> : 'اول پروفایل را از اینستاگرام بخوانید، بعد اطلاعات را بررسی و ذخیره کنید.'}
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_20rem]" noValidate>
        <div className="flex min-w-0 flex-col gap-6">
          <Section title="پیج اینستاگرام">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="شناسهٔ فعلی" htmlFor="shop-handle" error={errors.handle} className="flex-1">
                <Input
                  id="shop-handle"
                  dir="ltr"
                  placeholder="shop.handle"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={form.handle}
                  readOnly={Boolean(wishlistId)}
                  aria-invalid={Boolean(errors.handle)}
                  onChange={(e) => set('handle', e.target.value)}
                  onBlur={() => set('handle', normalizeHandle(form.handle))}
                />
              </Field>
              {isNew ? (
                <Button type="button" variant="outline" onClick={fetchProfile} disabled={busy}>
                  {profile.running ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
                  خواندن از اینستاگرام
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={refreshProfile} disabled={busy}>
                  {profile.running ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                  به‌روزرسانی از اینستاگرام
                </Button>
              )}
            </div>
            {profile.running && (
              <p role="status" className="text-sm text-ink-3">
                در حال خواندن پروفایل از اینستاگرام… معمولاً کمتر از یک دقیقه طول می‌کشد.
              </p>
            )}
            {fetchError && <Alert>{fetchError}</Alert>}
            {fetched?.imageError && !fetched.image && (
              <Alert tone="note">تصویر پروفایل گرفته نشد. لطفاً تصویر را دستی بارگذاری کنید.</Alert>
            )}
            {(form.profileFetchedAt || shop?.profileFetchedAt) && (
              <p className="text-xs text-ink-3">آخرین خواندن پروفایل: {fmtDateTime(form.profileFetchedAt ?? shop?.profileFetchedAt)}</p>
            )}
            <Field label="شناسه‌های قبلی" htmlFor="shop-prev" hint="پس از تغییر نام پیج؛ جست‌وجو با این شناسه‌ها هم فروشگاه را پیدا می‌کند.">
              <TagInput
                id="shop-prev"
                ltr
                prefix="@"
                value={form.previousHandles}
                normalize={normalizeHandle}
                onChange={(v) => set('previousHandles', v)}
                placeholder="old.handle"
              />
            </Field>
          </Section>

          <Section title="مشخصات">
            <Field label="نام فروشگاه" htmlFor="shop-name" error={errors.displayName}>
              <Input
                id="shop-name"
                maxLength={120}
                value={form.displayName}
                aria-invalid={Boolean(errors.displayName)}
                onChange={(e) => set('displayName', e.target.value)}
              />
            </Field>
            <Field label="وضعیت" htmlFor="shop-status">
              <Select dir="rtl" value={form.status} onValueChange={(v) => set('status', v as ShopStatus)}>
                <SelectTrigger id="shop-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SHOP_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="برچسب‌ها" htmlFor="shop-tags" hint="مثلاً «ارسال کند» یا «بسته‌بندی خوب». با Enter اضافه کنید.">
              <TagInput id="shop-tags" value={form.tags} onChange={(v) => set('tags', v)} />
            </Field>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-medium text-ink-2">دسته‌بندی‌ها</legend>
              {categories.loading ? (
                <LoadingRows rows={2} />
              ) : categories.error ? (
                <ErrorState error={categories.error} onRetry={categories.reload} />
              ) : !categories.data?.items.length ? (
                <p className="text-sm text-ink-3">
                  دسته‌بندی‌ای تعریف نشده.{' '}
                  <Link to="/categories" className="font-medium text-brand hover:underline">
                    افزودن دسته‌بندی
                  </Link>
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.data.items.map((c) => {
                    const checked = form.categoryIds.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-ink-2 hover:bg-subtle has-[[data-state=checked]]:border-brand-line has-[[data-state=checked]]:bg-brand-soft"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            set('categoryIds', v ? [...form.categoryIds, c._id] : form.categoryIds.filter((x) => x !== c._id))
                          }
                        />
                        {c.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
            <Field label="توضیح کوتاه (اختیاری)" htmlFor="shop-bio" hint="برای وب‌سایت؛ حداکثر ۱۰۰۰ نویسه.">
              <Textarea id="shop-bio" maxLength={1000} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
            </Field>
          </Section>

          <Section title="اطلاعات تماس" description="فقط چیزهایی که خود فروشگاه در پیجش نشان می‌دهد. اگر نشان نمی‌دهد، خالی بگذارید.">
            <ContactField id="shop-email" label="ایمیل" type="email" value={form.email} error={errors.email} onChange={(v) => set('email', v)} placeholder="name@example.com" />
            <ContactField id="shop-website" label="وب‌سایت" type="url" value={form.website} error={errors.website} onChange={(v) => set('website', v)} placeholder="https://" />
            <ContactField id="shop-phone" label="تلفن" type="tel" value={form.phone} error={errors.phone} onChange={(v) => set('phone', v)} placeholder="+98…" />
          </Section>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <Section title="تصویر پروفایل">
            <div className="flex flex-col items-center gap-3">
              <div className="grid size-36 place-items-center overflow-hidden rounded-full border border-line bg-subtle">
                {form.image ? (
                  <img src={form.image.url} alt={`تصویر پروفایل ${form.displayName}`} className="size-full object-cover" />
                ) : (
                  <ImageUp className="size-8 text-ink-3" aria-hidden="true" />
                )}
              </div>
              {errors.image && (
                <p role="alert" className="text-center text-xs text-danger">
                  {errors.image}
                </p>
              )}
              <input
                ref={fileInput}
                id="shop-image"
                type="file"
                accept={IMAGE_TYPES.join(',')}
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => fileInput.current?.click()}>
                {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImageUp aria-hidden="true" />}
                {form.image ? 'جایگزینی تصویر' : 'بارگذاری تصویر'}
              </Button>
              <p className="text-center text-xs leading-5 text-ink-3">JPEG، PNG یا WebP، حداکثر ۲ مگابایت.</p>
            </div>
          </Section>
          <Button type="submit" size="lg" disabled={busy}>
            {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {shop ? 'ذخیرهٔ تغییرات' : wishlistId ? 'ساخت فروشگاه و انتقال نقدها' : 'ساخت فروشگاه'}
          </Button>
        </div>
      </form>
    </>
  );
}

function ContactField({
  id,
  label,
  type,
  value,
  error,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="flex gap-2">
        <Input
          id={id}
          type={type}
          dir="ltr"
          maxLength={300}
          placeholder={placeholder}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button type="button" variant="ghost" size="icon" disabled={!value} onClick={() => onChange('')} aria-label={`پاک کردن ${label}`}>
          <X aria-hidden="true" />
        </Button>
      </div>
    </Field>
  );
}

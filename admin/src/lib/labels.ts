// Persian labels for enums, error codes and number/date formatting (PRD §9: Persian first).
export type Tone = 'danger' | 'warn' | 'caution' | 'success' | 'neutral';
import type { Direction, JobType, Outcome, ReviewerPermission, ShopStatus } from './types';

// Same copy as the bot replies (backend/src/i18n/fa.ts) and pagesanj.
export const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  serious_warning: 'هشدار جدی',
  warning: 'هشدار',
  mixed: 'تجربه‌های متفاوت',
  recommended: 'پیشنهادی (تست‌شده)',
  no_known_issues: 'مشکلی گزارش نشده',
};

// MASTER.md status mapping.
export const SHOP_STATUS_TONE: Record<ShopStatus, Tone> = {
  serious_warning: 'danger',
  warning: 'warn',
  mixed: 'caution',
  recommended: 'success',
  no_known_issues: 'neutral',
};

export const OUTCOME_LABELS: Record<Outcome, string> = {
  delivered_ok: 'تحویل سالم',
  delivered_not_as_described: 'تحویل، اما مغایر توضیحات',
  not_delivered: 'تحویل نشد',
  return_refused: 'مرجوعی پذیرفته نشد',
  other_problem: 'مشکل دیگر',
};

export const DIRECTION_LABELS: Record<Direction, string> = {
  positive: 'مثبت',
  negative: 'منفی',
  mixed: 'دوگانه',
};

export const DIRECTION_TONE: Record<Direction, Tone> = {
  positive: 'success',
  negative: 'danger',
  mixed: 'caution',
};

export const PERMISSION_LABELS: Record<ReviewerPermission, string> = {
  link_only: 'فقط لینک',
  screenshot: 'اسکرین‌شات',
  embed: 'جاسازی پست',
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  daily_check: 'بررسی روزانه',
  backfill: 'پست‌های قبلی',
  post_owner_lookup: 'یافتن صاحب پست',
  profile_fetch: 'خواندن پروفایل',
  token_refresh: 'تمدید توکن',
};

export const WISHLIST_SOURCE_LABELS = { dm: 'دایرکت', reviewer_post: 'پست نقد' } as const;

export const COUNT_LABELS: Record<string, string> = {
  postsFetched: 'پست دریافتی',
  reviewsCreated: 'نقد جدید',
  wishlisted: 'فهرست انتظار',
  skipped: 'ردشده',
  duplicates: 'تکراری',
  items: 'آیتم',
  imageStored: 'تصویر',
  sources: 'پیج',
};

const ERROR_LABELS: Record<string, string> = {
  network: 'اتصال به سرور برقرار نشد. اینترنت را بررسی کنید و دوباره تلاش کنید.',
  invalid_credentials: 'نام کاربری، رمز عبور یا کد تأیید درست نیست.',
  unauthorized: 'نشست شما تمام شده است. دوباره وارد شوید.',
  invalid_input: 'بعضی از فیلدها درست پر نشده‌اند.',
  not_found: 'این مورد پیدا نشد؛ شاید حذف شده باشد.',
  not_pending: 'این نقد دیگر در انتظار بررسی نیست.',
  already_rejected: 'این نقد قبلاً رد شده است.',
  review_not_on_shop: 'این نقد هنوز به فروشگاهی وصل نیست. اول مورد فهرست انتظار را به فروشگاه تبدیل یا وصل کنید.',
  already_promoted: 'این مورد قبلاً به فروشگاه تبدیل شده است.',
  category_exists: 'دسته‌بندی‌ای با همین نام وجود دارد.',
  category_in_use: 'فروشگاه‌هایی از این دسته‌بندی استفاده می‌کنند؛ اول آن‌ها را جابه‌جا کنید.',
  handle_in_use: 'این شناسه را فروشگاه دیگری دارد.',
  invalid_handle: 'شناسهٔ اینستاگرام معتبر نیست.',
  image_empty: 'فایل تصویر خالی است.',
  unknown_image: 'تصویر پروفایل پیدا نشد؛ دوباره بارگذاری کنید.',
  unknown_category: 'یکی از دسته‌بندی‌ها دیگر وجود ندارد.',
  source_exists: 'این پیج نقد قبلاً اضافه شده است.',
  bad_request: 'درخواست نامعتبر بود (شاید فایل بیش از ۲ مگابایت است).',
  internal_error: 'خطای سرور. کمی بعد دوباره تلاش کنید.',
};

export function errorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (code.startsWith('image_')) return 'تصویر پذیرفته نشد. فقط JPEG، PNG یا WebP تا ۲ مگابایت.';
  return ERROR_LABELS[code] ?? 'خطای ناشناخته. دوباره تلاش کنید.';
}

const faNumber = new Intl.NumberFormat('fa-IR');
export const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : faNumber.format(n));

const usd = new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 });
export const money = (n: number | null | undefined) => (n === null || n === undefined ? '—' : usd.format(n));

const dateTime = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' });
const dateOnly = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' });
export const fmtDateTime = (iso?: string | null) => (iso ? dateTime.format(new Date(iso)) : '—');
export const fmtDate = (iso?: string | null) => (iso ? dateOnly.format(new Date(iso)) : '—');

const relative = new Intl.RelativeTimeFormat('fa-IR', { numeric: 'auto' });
export function fmtAgo(iso?: string | null) {
  if (!iso) return '—';
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);
  if (abs < 60) return 'همین حالا';
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return relative.format(Math.round(seconds / 86400), 'day');
  return fmtDate(iso);
}

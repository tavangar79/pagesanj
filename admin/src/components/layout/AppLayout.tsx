// Sidebar on desktop, top bar with a menu sheet on mobile (PRD §9).
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  BriefcaseBusiness,
  ClipboardCheck,
  Gauge,
  Layers,
  ListOrdered,
  LogOut,
  Menu,
  Rss,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/labels';
import { cn } from '@/lib/utils';

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/reviews', label: 'نقدهای در انتظار', icon: ClipboardCheck },
  { to: '/wishlist', label: 'فهرست انتظار', icon: ListOrdered },
  { to: '/shops', label: 'فروشگاه‌ها', icon: Store },
  { to: '/categories', label: 'دسته‌بندی‌ها', icon: Layers },
  { to: '/reviewer-sources', label: 'پیج‌های نقد', icon: Rss },
  { to: '/jobs', label: 'کارها و هزینه', icon: Gauge },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-solid text-on-brand">
        <BriefcaseBusiness className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-ink">پیج‌سنج</span>
        <span className="text-xs text-ink-3">پنل مدیریت</span>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-10 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-brand-line bg-brand-soft text-brand'
                  : 'border-transparent text-ink-2 hover:bg-subtle hover:text-ink',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function AccountBox() {
  const { admin, logout } = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await logout();
    } catch (err) {
      toast.error(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-ink-3">واردشده با</span>
        <span dir="ltr" className="truncate text-start text-sm font-medium text-ink">
          {admin?.username}
        </span>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onLogout} disabled={pending} aria-label="خروج از حساب">
        <LogOut aria-hidden="true" />
      </Button>
    </div>
  );
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-raised"
      >
        رفتن به محتوا
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-e border-line bg-surface p-4 lg:flex">
        <Brand />
        <nav aria-label="بخش‌های پنل" className="flex-1 overflow-y-auto">
          <NavList />
        </nav>
        <AccountBox />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 top-14 z-20 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            aria-label="بستن منو"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="بخش‌های پنل"
            className="relative flex flex-col gap-4 border-b border-line bg-surface p-4 shadow-raised animate-in fade-in-0 slide-in-from-top-2"
          >
            <NavList onNavigate={() => setMenuOpen(false)} />
            <AccountBox />
          </nav>
        </div>
      )}

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

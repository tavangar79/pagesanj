import { NavLink, Outlet } from 'react-router';

const NAV = [
  { to: '/reviews', label: 'نقدهای در انتظار' },
  { to: '/wishlist', label: 'فهرست انتظار' },
  { to: '/shops', label: 'فروشگاه‌ها' },
  { to: '/categories', label: 'دسته‌بندی‌ها' },
  { to: '/reviewer-sources', label: 'پیج‌های نقد' },
  { to: '/jobs', label: 'کارها' },
];

// Sidebar on desktop, top bar on mobile (PRD §9). TODO: mobile collapse.
export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <nav className="w-56 border-e border-border p-4">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className="block rounded px-3 py-2">
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { PendingReviews } from '@/pages/PendingReviews';
import { Wishlist } from '@/pages/Wishlist';
import { Shops } from '@/pages/Shops';
import { ShopEdit } from '@/pages/ShopEdit';
import { Categories } from '@/pages/Categories';
import { ReviewerSources } from '@/pages/ReviewerSources';
import { Jobs } from '@/pages/Jobs';

export function App() {
  // TODO: redirect to /login when the session check fails.
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/reviews" replace />} />
        <Route path="/reviews" element={<PendingReviews />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/:id" element={<ShopEdit />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/reviewer-sources" element={<ReviewerSources />} />
        <Route path="/jobs" element={<Jobs />} />
      </Route>
    </Routes>
  );
}

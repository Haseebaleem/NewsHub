import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (token === null || token === '') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RedirectIfAuthed() {
  const token = useAuthStore((s) => s.token);
  if (token !== null && token !== '') {
    return <Navigate to="/feed" replace />;
  }
  return <Outlet />;
}

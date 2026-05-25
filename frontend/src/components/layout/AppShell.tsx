import { useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useApplyTheme } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';
import { useMe } from '@/hooks/queries';
import { logout as logoutRequest } from '@/api/auth';

export function AppShell() {
  useApplyTheme();
  const { data: user } = useMe();
  const cachedUser = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = useCallback((): void => {
    void (async () => {
      try {
        await logoutRequest();
      } catch {
        // Token may already be invalid server-side; we still want a clean
        // local logout, so swallow upstream errors here.
      }
      clearSession();
      queryClient.clear();
      toast.success('Signed out.');
      navigate('/login', { replace: true });
    })();
  }, [clearSession, navigate, queryClient]);

  const display = user ?? cachedUser;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sidebar onSignOut={handleSignOut} />

      <div className="lg:pl-60">
        <Topbar user={display ?? null} onSignOut={handleSignOut} />
        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import Logo from './ui/Logo';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/services/api';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  hr: 'HR Manager',
  supervisor: 'Supervisor',
  employee: 'Employee',
};

const Layout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch {
        // best-effort — clear local session regardless of server outcome
      }
    }
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Sidebar — fixed on desktop, slide-over drawer on small screens */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-ink-900 p-4 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Logo variant="mark" className="h-8 w-8 rounded bg-white p-1" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Port-Ago</p>
              <p className="text-[11px] text-ink-400">GeoTrackHR</p>
            </div>
          </div>
          <button
            className="rounded p-1 text-ink-400 hover:text-white lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-ink-900/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 sm:px-6">
          <button
            className="rounded p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />

          <div className="relative">
            <button
              className="focus-ring flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-ink-50"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {(user?.fullName ?? user?.email ?? '?').charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-ink-800">{user?.fullName ?? user?.email}</span>
                <span className="block text-xs text-ink-400">{user ? ROLE_LABELS[user.role] ?? user.role : ''}</span>
              </span>
              <ChevronDown size={16} className="text-ink-400" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-ink-100 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/account');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <UserCircle size={16} />
                    My Account
                  </button>
                  <div className="my-1 h-px bg-ink-100" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

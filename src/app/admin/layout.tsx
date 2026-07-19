'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isLoggedIn, getAdmin, clearAuth, updateLastActive, isSessionExpired } from '@/lib/auth';
import {
  LayoutDashboard,
  Pill,
  FlaskConical,
  ShoppingBasket,
  FileText,
  Tag,
  Store,
  LogOut,
  Menu,
  X,
  Cross,
  User,
  Clock,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';
import clsx from 'clsx';
import { authApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARN_BEFORE_MS = 60 * 1000;        // warn 1 minute before expiry

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/drugs', label: 'Drugs', icon: Pill },
  { href: '/admin/laboratory', label: 'Lab Tests', icon: FlaskConical },
  { href: '/admin/supermarket', label: 'Supermarket', icon: ShoppingBasket },
  { href: '/admin/blogs', label: 'Blog Posts', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/store-info', label: 'Store Info', icon: Store },
  { href: '/admin/profile', label: 'Profile', icon: User },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);

  // Session state
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const expireSession = useCallback(() => {
    clearAuth();
    setShowWarningBanner(false);
    setShowExpiredModal(true);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (pathname === '/admin/login') return;
    if (showExpiredModal) return; // already expired, don't reset

    clearAllTimers();
    setShowWarningBanner(false);
    setCountdown(60);
    updateLastActive();

    // Warn 1 minute before expiry
    warnTimerRef.current = setTimeout(() => {
      setShowWarningBanner(true);
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS);

    // Expire after full timeout
    idleTimerRef.current = setTimeout(expireSession, IDLE_TIMEOUT_MS);
  }, [pathname, showExpiredModal, clearAllTimers, expireSession]);

  // Attach activity listeners
  useEffect(() => {
    if (pathname === '/admin/login') return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handler = () => resetIdleTimer();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearAllTimers();
    };
  }, [pathname, resetIdleTimer, clearAllTimers]);

  // Auth + initial session check
  useEffect(() => {
    if (pathname === '/admin/login') return;

    if (!isLoggedIn()) {
      router.replace('/admin/login');
      return;
    }

    if (isSessionExpired()) {
      clearAuth();
      setShowExpiredModal(true);
      return;
    }

    setAdmin(getAdmin());
    resetIdleTimer(); // start the idle clock
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleGoToLogin = () => {
    setShowExpiredModal(false);
    router.replace('/admin/login');
  };

  const handleStayLoggedIn = () => {
    resetIdleTimer();
    setShowWarningBanner(false);
  };

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    clearAllTimers();
    const token = getToken();
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        // proceed with local logout even if API fails
      }
    }
    clearAuth();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Session Expired Modal ── */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mb-4">
              <ShieldAlert className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-sm text-gray-500 mb-6">
              You were inactive for 15 minutes and have been signed out for security. Please sign in again to continue.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              Sign In Again
            </button>
          </div>
        </div>
      )}

      {/* ── Idle Warning Banner ── */}
      {showWarningBanner && !showExpiredModal && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4">
            <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#25D366' }}>
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Still there?</p>
              <p className="text-xs text-gray-400">
                You'll be signed out in <span className="text-white font-bold">{countdown}s</span> due to inactivity.
              </p>
            </div>
            <button
              onClick={handleStayLoggedIn}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              Stay
            </button>
          </div>
        </div>
      )}

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-gray-900 z-30 flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#25D366' }}>
                <Cross className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">MiniquesCare</p>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>
            <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
                style={active ? { background: '#25D366' } : undefined}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          {admin && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#25D366' }}>
                {admin.name?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{admin.name}</p>
                <p className="text-xs text-gray-400 truncate">{admin.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="ml-auto text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← View Site
          </Link>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Wallet,
  ShoppingCart,
  CalendarClock,
  TrendingUp,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AdminHeader, Select } from '@/components/admin/AdminUI'; // adjust path to match your project

/* ─── Types ──────────────────────────────────────────────────────────── */
interface AnalyticsSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  cartRevenue: number;
  cartTransactions: number;
  bookingRevenue: number;
  bookingTransactions: number;
  confirmedRevenue: number;
  confirmedTransactions: number;
  pendingTransactions: number;
}

interface AnalyticsTrendPoint {
  label: string;
  paymentType: 'Cart' | 'Booking';
  revenue: number;
  transactionCount: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  trend: AnalyticsTrendPoint[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type RangeOption = 'daily' | 'weekly' | 'monthly' | 'custom';
type PaymentTypeOption = '' | 'Cart' | 'Booking';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7067';

/* ─── Helpers ────────────────────────────────────────────────────────── */
const currency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

/* ─── Summary Card ───────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = '#25D366',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}1A` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Trend Chart (lightweight, no chart lib dependency) ────────────── */
function TrendChart({ trend }: { trend: AnalyticsTrendPoint[] }) {
  const labels = useMemo(() => Array.from(new Set(trend.map((t) => t.label))), [trend]);
  const maxRevenue = Math.max(1, ...trend.map((t) => t.revenue));

  const byLabel = useMemo(() => {
    const map = new Map<string, { cart?: AnalyticsTrendPoint; booking?: AnalyticsTrendPoint }>();
    for (const label of labels) map.set(label, {});
    for (const t of trend) {
      const entry = map.get(t.label) ?? {};
      if (t.paymentType === 'Cart') entry.cart = t;
      if (t.paymentType === 'Booking') entry.booking = t;
      map.set(t.label, entry);
    }
    return map;
  }, [trend, labels]);

  if (trend.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-400">
        No trend data for this period.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#25D366' }} /> Cart
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#128C7E' }} /> Booking
          </span>
        </div>
      </div>

      <div className="flex items-end gap-4 h-48">
        {labels.map((label) => {
          const { cart, booking } = byLabel.get(label) ?? {};
          const cartH = cart ? Math.max(4, (cart.revenue / maxRevenue) * 100) : 0;
          const bookingH = booking ? Math.max(4, (booking.revenue / maxRevenue) * 100) : 0;
          return (
            <div key={label} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="flex items-end gap-1 h-full w-full justify-center">
                <div
                  className="w-3 rounded-t-sm transition-all"
                  style={{ height: `${cartH}%`, background: '#25D366' }}
                  title={cart ? `${currency(cart.revenue)} · ${cart.transactionCount} txns` : ''}
                />
                <div
                  className="w-3 rounded-t-sm transition-all"
                  style={{ height: `${bookingH}%`, background: '#128C7E' }}
                  title={booking ? `${currency(booking.revenue)} · ${booking.transactionCount} txns` : ''}
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-2 whitespace-nowrap">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Dashboard Page ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [range, setRange] = useState<RangeOption>('weekly');
  const [paymentType, setPaymentType] = useState<PaymentTypeOption>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (range === 'custom' && (!from || !to)) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ range });
    if (paymentType) params.set('paymentType', paymentType);
    if (range === 'custom') {
      params.set('from', new Date(from).toISOString());
      params.set('to', new Date(to).toISOString());
    }

    try {
      const res = await fetch(`${API_URL}/api/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      const json: ApiResponse<AnalyticsData> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load analytics.');
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [range, paymentType, from, to]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const s = data?.summary;

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Revenue and transaction analytics across the store." />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Range</label>
          <Select value={range} onChange={(e) => setRange(e.target.value as RangeOption)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </Select>
        </div>

        <div className="w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Payment Type</label>
          <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentTypeOption)}>
            <option value="">All</option>
            <option value="Cart">Cart</option>
            <option value="Booking">Booking</option>
          </Select>
        </div>

        {range === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#25D366' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#25D366' } as React.CSSProperties}
              />
            </div>
          </>
        )}

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ background: '#25D366' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading analytics…</div>
      ) : s ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Wallet} label="Total Revenue" value={currency(s.totalRevenue)} sub={`${s.totalTransactions} transactions`} />
            <StatCard icon={TrendingUp} label="Avg Order Value" value={currency(s.averageOrderValue)} accent="#128C7E" />
            <StatCard icon={ShoppingCart} label="Cart Revenue" value={currency(s.cartRevenue)} sub={`${s.cartTransactions} orders`} />
            <StatCard icon={CalendarClock} label="Booking Revenue" value={currency(s.bookingRevenue)} sub={`${s.bookingTransactions} bookings`} accent="#128C7E" />
            <StatCard icon={CheckCircle2} label="Confirmed Revenue" value={currency(s.confirmedRevenue)} sub={`${s.confirmedTransactions} confirmed`} />
            <StatCard icon={Clock} label="Pending Transactions" value={String(s.pendingTransactions)} accent="#f59e0b" />
          </div>

          {/* Trend chart */}
          <TrendChart trend={data!.trend} />
        </>
      ) : (
        <div className="py-20 text-center text-sm text-gray-400">No analytics available.</div>
      )}
    </div>
  );
}
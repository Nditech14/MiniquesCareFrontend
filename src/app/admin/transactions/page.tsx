'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { paymentApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Transaction, PagedResult } from '@/types';
import { Modal } from '@/components/admin';
import { EmptyState, Pagination, Spinner } from '@/components/ui';
import clsx from 'clsx';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Failed', 'Cancelled'];

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-600',
  Cancelled: 'bg-gray-100 text-gray-600',
};

export default function AdminTransactionsPage() {
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  // ✅ Seed from ?reference= so links from admin emails land directly on
  // the matching transaction instead of the full unfiltered list.
  const [referenceFilter, setReferenceFilter] = useState(
    () => searchParams.get('reference') ?? ''
  );
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ✅ True only when the filter was pre-filled from the URL — used to
  // auto-open the modal once, without re-triggering on manual searches.
  const [autoOpenFromLink, setAutoOpenFromLink] = useState(
    () => !!searchParams.get('reference')
  );
  const pageSize = 20;

  // Reference lookup hits GetOne (/api/Payment/transaction/{reference}),
  // which is [AllowAnonymous] on the backend — so this works with or
  // without a token. Pass it through anyway when present (harmless extra
  // header), but never block the call on its absence.
  const fetchByReference = useCallback(async (reference: string, token?: string) => {
    const txn = (await paymentApi.getByReference(reference, token)) as Transaction | null;
    if (!txn) {
      setTransactions([]);
      setTotalCount(0);
      setError('No transaction found with that reference.');
      return;
    }
    setTransactions([txn]);
    setTotalCount(1);

    // ✅ Came in via a reference link — jump straight into the detail view.
    if (autoOpenFromLink) {
      setSelected(txn);
      setAutoOpenFromLink(false);
    }
  }, [autoOpenFromLink]);

  const fetchAll = useCallback(async (token: string) => {
    // API returns { items, total, page, pageSize } directly — no wrapper.
    const paged = (await paymentApi.getAll(
      page,
      pageSize,
      statusFilter || undefined,
      emailFilter || undefined,
      token
    )) as PagedResult<Transaction>;

    if (!paged) {
      setError('Failed to load transactions.');
      return;
    }
    setTransactions(paged.items);
    setTotalCount(paged.total);
  }, [page, statusFilter, emailFilter]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();

      if (referenceFilter.trim()) {
        // ✅ Public lookup — works with or without a token.
        await fetchByReference(referenceFilter.trim(), token ?? undefined);
        return;
      }

      // The paginated list stays behind login.
      if (!token) {
        setError('You must be logged in to view transactions.');
        return;
      }
      await fetchAll(token);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [referenceFilter, fetchByReference, fetchAll]);

  useEffect(() => {
    const t = setTimeout(fetchTransactions, 300);
    return () => clearTimeout(t);
  }, [fetchTransactions]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const isReferenceSearch = referenceFilter.trim().length > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">View and verify payment transactions.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          disabled={isReferenceSearch}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white disabled:opacity-50"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={emailFilter}
          disabled={isReferenceSearch}
          onChange={(e) => {
            setEmailFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Search by email..."
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white flex-1 min-w-50 disabled:opacity-50"
        />
        <input
          value={referenceFilter}
          onChange={(e) => {
            setReferenceFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Search by transaction reference..."
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white flex-1 min-w-60"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-4">
          {error}{' '}
          <button onClick={fetchTransactions} className="underline font-medium">
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState message="No transactions found." />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{t.transactionReference}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {t.paymentType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.customerEmail}</p>
                      <p className="text-xs text-gray-400">{t.customerPhoneNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {t.items && t.items.length > 0
                        ? `${t.items.length} item${t.items.length > 1 ? 's' : ''}`
                        : '—'}
                    </td>
                    {/* ✅ no division — API already returns amount in naira */}
                    <td className="px-4 py-3 font-semibold">
                      ₦{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          statusColors[t.transactionStatus] ?? 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {t.transactionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(t)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isReferenceSearch && totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          )}
        </>
      )}

      <Modal
        open={!!selected}
        title={selected ? `Transaction ${selected.transactionReference}` : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Email</p>
                <p className="font-medium">{selected.customerEmail}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="font-medium">{selected.customerPhoneNumber}</p>
              </div>
              <div>
                <p className="text-gray-400">Amount</p>
                {/* ✅ no division here either */}
                <p className="font-bold text-lg">₦{selected.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Currency</p>
                <p className="font-medium">{selected.currency || 'NGN'}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment Type</p>
                <p className="font-medium">{selected.paymentType}</p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <span
                  className={clsx(
                    'inline-block text-xs px-2 py-1 rounded-full font-medium',
                    statusColors[selected.transactionStatus] ?? 'bg-gray-100 text-gray-600'
                  )}
                >
                  {selected.transactionStatus}
                </span>
              </div>
              <div>
                <p className="text-gray-400">Date</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selected.items && selected.items.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-400 text-sm mb-2">Items</p>
                <div className="space-y-1.5">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="font-medium">₦{item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
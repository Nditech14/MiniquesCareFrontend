'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { paymentApi } from '@/lib/api';
import type { Transaction } from '@/types';
import { Spinner, EmptyState } from '@/components/ui';
import { CheckCircle2, Clock, XCircle, Printer } from 'lucide-react';
import clsx from 'clsx';

type StatusConfig = {
  color: string;
  bg: string;
  icon: React.ComponentType<{ className?: string }>;
};

const statusConfig: Record<string, StatusConfig> = {
  Confirmed: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  Pending: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  Failed: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  Cancelled: { color: 'text-gray-600', bg: 'bg-gray-100', icon: XCircle },
};

export default function ReceiptPage() {
  const params = useParams<{ reference: string }>();
  const reference = params.reference;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Receipt lookup is public — no admin token required.
        const txn = (await paymentApi.getByReference(reference)) as Transaction | null;
        if (!txn) {
          setError('We couldn\u2019t find a transaction with that reference.');
          return;
        }
        setTransaction(txn);
      } catch (err) {
        console.error('Failed to load receipt:', err);
        setError('Failed to load this receipt. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Spinner />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <EmptyState message={error ?? 'Receipt not found.'} />
        </div>
      </div>
    );
  }

  const status = statusConfig[transaction.transactionStatus] ?? statusConfig.Pending;
  const StatusIcon = status.icon;

  const itemsTotal =
    transaction.items?.reduce((sum, item) => sum + item.totalPrice, 0) ?? null;
  const deliveryFee =
    itemsTotal != null ? transaction.amount - itemsTotal : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-lg mx-auto">
        {/* Print button — hidden when printing */}
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-100 text-center">
            <h1 className="text-lg font-bold text-gray-900">MiniquesCare</h1>
            <p className="text-xs text-gray-400 mt-0.5">Payment Receipt</p>
          </div>

          {/* Status */}
          <div className="px-6 py-5 flex flex-col items-center border-b border-gray-100">
            <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center mb-3', status.bg)}>
              <StatusIcon className={clsx('w-6 h-6', status.color)} />
            </div>
            <span className={clsx('text-sm font-semibold px-3 py-1 rounded-full', status.bg, status.color)}>
              {transaction.transactionStatus}
            </span>
            <p className="font-mono text-xs text-gray-400 mt-3">{transaction.transactionReference}</p>
          </div>

          {/* Customer details */}
          <div className="px-6 py-5 border-b border-gray-100 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Customer</p>
              <p className="font-medium text-gray-900">{transaction.customerEmail}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Phone</p>
              <p className="font-medium text-gray-900">{transaction.customerPhoneNumber}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Payment Type</p>
              <p className="font-medium text-gray-900">{transaction.paymentType}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Date</p>
              <p className="font-medium text-gray-900">
                {new Date(transaction.createdAt).toLocaleString('en-NG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          {/* Items */}
          {transaction.items && transaction.items.length > 0 && (
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-gray-400 text-xs mb-3">Items</p>
              <div className="space-y-2.5">
                {transaction.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      ₦{item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="px-6 py-5 space-y-2 border-b border-gray-100">
            {itemsTotal != null && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₦{itemsTotal.toLocaleString()}</span>
              </div>
            )}
            {deliveryFee != null && deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span>₦{deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>₦{transaction.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 text-center">
            <p className="text-xs text-gray-400">
              {transaction.currency || 'NGN'} · Thank you for shopping with MiniquesCare
            </p>
            {transaction.paystackChannel && (
              <p className="text-xs text-gray-300 mt-1">
                Paid via {transaction.paystackChannel}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import { getInvoiceSnapshot, removeInvoiceSnapshot, type InvoiceSnapshot } from '@/lib/invoiceCache';
import { useCart } from '@/context/CartContext';
import { Loader2, XCircle } from 'lucide-react';

type Status = 'checking' | 'success' | 'failed';

export default function OrderConfirmPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const { forceClearCart } = useCart();

  const [status, setStatus] = useState<Status>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [invoice, setInvoice] = useState<InvoiceSnapshot | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setErrorMessage("We couldn't find your payment reference.");
      return;
    }

    fetch(`${getApiBaseUrl()}/api/Payment/verify/${encodeURIComponent(reference)}`)
      .then(async (r) => {
        if (r.status === 404) {
          throw new Error("We couldn't find that transaction.");
        }
        return r.json();
      })
      .then(async (res) => {
        const txnStatus = res?.transactionStatus;
        if (txnStatus === 'Confirmed') {
          setStatus('success');
          sessionStorage.removeItem('mc_pending_reference');

          const cached = getInvoiceSnapshot(reference);
          if (cached) {
            setInvoice(cached);
            removeInvoiceSnapshot(reference);
          }

          // ✅ Actively deletes every item the cart currently has, via the
          // same DELETE endpoint the cart page's trash-can button uses.
          // Doesn't wait on or trust the backend's own post-payment clear
          // step — just guarantees the cart is empty from the frontend's
          // side, regardless of what is or isn't happening server-side.
          await forceClearCart();
        } else {
          setStatus('failed');
          setErrorMessage(
            txnStatus === 'Failed'
              ? 'Your payment was not successful.'
              : "We couldn't confirm your payment yet."
          );
        }
      })
      .catch((err) => {
        setStatus('failed');
        setErrorMessage(err instanceof Error ? err.message : "We couldn't reach the server to confirm your payment.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <section className="max-w-lg mx-auto px-4 sm:px-6 py-16">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        {status === 'checking' && (
          <>
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Just confirming your payment…</h2>
            <p className="text-gray-500">This'll only take a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
              style={{ background: '#f0fdf4', color: '#25D366' }}
            >
              ✓
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you! 🎉</h2>
            {reference && (
              <p className="text-sm text-gray-500 mb-2">
                Order reference: <span className="font-semibold text-gray-900">{reference}</span>
              </p>
            )}
            <p className="text-gray-600 mb-6">
              Your payment's confirmed and we're already on it. We'll reach out shortly to sort out
              delivery or pickup — hang tight!
            </p>

            {invoice && (
              <div className="text-left border-t border-dashed border-gray-200 pt-6 mb-6">
                {invoice.items.length > 0 && (
                  <ul className="divide-y divide-gray-100 mb-4">
                    {invoice.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <p className="text-gray-900 font-medium">{item.productName}</p>
                          <p className="text-gray-500">
                            {item.quantity} × ₦{item.unitPrice.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ₦{item.totalPrice.toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">₦{invoice.breakdown.subtotal.toLocaleString()}</span>
                  </div>

                  {invoice.breakdown.discount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Discount ({invoice.breakdown.discount.name})
                      </span>
                      <span style={{ color: '#25D366' }}>
                        -₦{invoice.breakdown.discount.amount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {invoice.breakdown.shipping && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Delivery ({invoice.breakdown.shipping.rateName})
                      </span>
                      <span className="text-gray-900">
                        ₦{invoice.breakdown.shipping.cost.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-bold text-base">
                    <span>Total</span>
                    <span>₦{invoice.breakdown.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
              style={{ background: '#25D366' }}
            >
              Back to Home
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">We couldn't confirm that payment</h2>
            <p className="text-gray-600 mb-6">
              {errorMessage} If money left your account, don't worry — reach out to us with your
              reference and we'll sort it out right away.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/checkout"
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: '#25D366' }}
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
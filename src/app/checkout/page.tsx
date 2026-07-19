'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { cartApi, getApiBaseUrl } from '@/lib/api';
import type { CartBreakdown } from '@/lib/api';
import { saveInvoiceSnapshot, type InvoiceItem } from '@/lib/invoiceCache';
import { ShieldAlert, Truck, Store, Loader2 } from 'lucide-react';

type FulfillmentType = 'Delivery' | 'Pickup';

interface ShippingRate {
  id: number;
  name: string;
  locations: string;
  price: number;
  isActive: boolean;
}

export default function CheckoutPage() {
  const { items, cartId, loading: cartLoading, refresh } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  // Pickup is free and simpler for most customers, so it's the default.
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<number>();
  const [loadingRates, setLoadingRates] = useState(false);

  const [breakdown, setBreakdown] = useState<CartBreakdown | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const hasRxItems = items.some((i) => i.requiresPrescription);

  useEffect(() => {
    setLoadingRates(true);
    fetch(`${getApiBaseUrl()}/api/ShippingRate/all`)
      .then((r) => r.json())
      .then((data) => {
        const rates: ShippingRate[] = data?.data ?? data ?? [];
        setShippingRates(rates.filter((r) => r.isActive !== false));
      })
      .catch((err) => console.error('Failed to fetch shipping rates:', err))
      .finally(() => setLoadingRates(false));
  }, []);

  const fetchBreakdown = useCallback(async () => {
    if (!cartId || items.length === 0) return;

    // Pickup has no shipping to calculate, so we can go straight to a preview.
    if (fulfillment === 'Delivery' && !selectedShippingId) {
      setBreakdown(null);
      return;
    }

    setBreakdownLoading(true);
    setBreakdownError('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await cartApi.preview({
        cartId,
        isDelivery: fulfillment === 'Delivery',
        shippingRateId: fulfillment === 'Delivery' ? selectedShippingId : undefined,
      });
      if (res.success && res.data) {
        setBreakdown(res.data.breakdown);
      } else {
        setBreakdownError(res.message || "Couldn't work out your totals just now");
      }
    } catch (err) {
      setBreakdownError(err instanceof Error ? err.message : "Couldn't work out your totals just now");
    } finally {
      setBreakdownLoading(false);
    }
  }, [cartId, items.length, fulfillment, selectedShippingId]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  const subtotal = breakdown?.subtotal ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = breakdown?.total ?? subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cartId) {
      setError("We couldn't find your cart — try refreshing the page.");
      return;
    }
    if (fulfillment === 'Delivery' && !selectedShippingId) {
      setError('Just pick a delivery location and we\'ll be good to go.');
      return;
    }

    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await cartApi.checkout({
        cartId,
        email: customerEmail,
        fullName: customerName,
        phoneNumber: customerPhone,
        isDelivery: fulfillment === 'Delivery',
        delivery:
          fulfillment === 'Delivery'
            ? { address: deliveryAddress, landmark: deliveryLandmark, shippingRateId: selectedShippingId }
            : undefined,
        orderNotes: deliveryNotes,
      });
      if (!res.success) throw new Error(res.message || "Hmm, that didn't go through. Mind trying again?");

      // This response only *initializes* the transaction — nothing's been
      // charged yet. We have to send the customer to Paystack's hosted page
      // to actually complete payment. The "Thank you" screen only makes
      // sense after Paystack redirects back to our callback as successful,
      // so we don't set `success` here at all.
      const authorizationUrl = res.data?.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error("We couldn't start the payment. Mind trying again?");
      }

      const reference = res.data?.reference ?? '';

      // Stash the reference so the return page can show it even before
      // the callback finishes confirming with the backend.
      sessionStorage.setItem('mc_pending_reference', reference);

      // ✅ Cache what's actually being bought right now, before redirecting.
      // res.data.breakdown is the exact CartBreakdownDto the backend charged
      // against, so the invoice page's totals will always match what was
      // actually paid — not a re-derived guess.
      if (reference) {
        const invoiceItems: InvoiceItem[] = items
          .filter((i) => i.cartItemId != null)
          .map((i) => ({
            id: i.cartItemId as number,
            productId: i.id,
            productName: i.name,
            productType: i.type,
            quantity: i.quantity,
            unitPrice: i.price,
            totalPrice: i.price * i.quantity,
            imageUrl: i.imageUrl,
          }));

        saveInvoiceSnapshot({
          reference,
          items: invoiceItems,
          breakdown: res.data.breakdown as CartBreakdown,
          customerEmail,
          customerPhoneNumber: customerPhone,
          createdAt: new Date().toISOString(),
        });
      }

      window.location.href = authorizationUrl;
      // Intentionally no setSubmitting(false) here — we're navigating away.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hmm, that didn't go through. Mind trying again?");
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-gray-500">
        Just a moment, getting your cart ready…
      </section>
    );
  }

  if (!cartLoading && items.length === 0 && !success) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart's looking a little empty</h1>
        <p className="text-gray-500 mb-6">Let's find something good for you.</p>
        <Link
          href="/pharmacy"
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold inline-block"
          style={{ background: '#25D366' }}
        >
          Start Shopping
        </Link>
      </section>
    );
  }

  if (success) {
    return (
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
            style={{ background: '#f0fdf4', color: '#25D366' }}
          >
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you! 🎉</h2>
          {orderNumber && (
            <p className="text-sm text-gray-500 mb-2">
              Here's your order reference: <span className="font-semibold text-gray-900">{orderNumber}</span>
            </p>
          )}
          <p className="text-gray-600 mb-6">
            We've got your order and we're on it. We'll reach out shortly to sort out{' '}
            {fulfillment === 'Delivery' ? 'delivery' : 'pickup'} — hang tight!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: '#25D366' }}
          >
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Almost there!</h1>
      <p className="text-gray-500 mb-8">Just a few details and we'll get your order moving.</p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Who's this order for?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  placeholder="you@email.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">How would you like to get your order?</h2>
            <p className="text-sm text-gray-500 mb-4">Pick whichever's easiest for you.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  fulfillment === 'Pickup' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  checked={fulfillment === 'Pickup'}
                  onChange={() => setFulfillment('Pickup')}
                  className="accent-green-600"
                />
                <Store className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Pick it up ourselves</p>
                  <p className="text-xs text-gray-500">Swing by the store — completely free</p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  fulfillment === 'Delivery' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  checked={fulfillment === 'Delivery'}
                  onChange={() => setFulfillment('Delivery')}
                  className="accent-green-600"
                />
                <Truck className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Bring it to me</p>
                  <p className="text-xs text-gray-500">We'll deliver straight to your door</p>
                </div>
              </label>
            </div>

            {fulfillment === 'Delivery' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Where should we deliver? *</label>
                  <select
                    required
                    value={selectedShippingId ?? ''}
                    onChange={(e) => setSelectedShippingId(Number(e.target.value) || undefined)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
                  >
                    <option value="" disabled>
                      {loadingRates ? 'Just a sec, loading locations...' : 'Choose your area'}
                    </option>
                    {shippingRates.map((rate) => (
                      <option key={rate.id} value={rate.id}>
                        {rate.name} ({rate.locations}) — ₦{rate.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your address *</label>
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                    placeholder="Street, house number"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Any landmark nearby? (optional)</label>
                  <input
                    value={deliveryLandmark}
                    onChange={(e) => setDeliveryLandmark(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                    placeholder="Helps our rider find you faster"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anything else we should know? (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                    placeholder="e.g. call when you arrive, gate code, etc."
                  />
                </div>
              </div>
            )}
          </div>

          {hasRxItems && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Quick heads up on your prescription</p>
                <p className="text-sm text-amber-700 mt-1">
                  A couple of items in your cart need a prescription. Our pharmacist will give you a quick
                  call to check everything's in order before we get it ready.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex justify-between text-sm gap-3">
                  <span className="text-gray-600 flex-1">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900 shrink-0">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{fulfillment === 'Delivery' ? 'Delivery' : 'Pickup'}</span>
                <span>
                  {breakdownLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                  ) : fulfillment === 'Delivery' ? (
                    breakdown?.shipping ? `₦${breakdown.shipping.cost.toLocaleString()}` : '—'
                  ) : (
                    'Free 🎉'
                  )}
                </span>
              </div>
              {breakdown?.discount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({breakdown.discount.name})</span>
                  <span>-₦{breakdown.discount.amount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {breakdownError && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
                {breakdownError}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">₦{total.toLocaleString()}</span>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#25D366' }}
            >
              {submitting ? 'Placing your order...' : "You're all set — Place Order"}
            </button>

            <Link href="/cart" className="block text-center text-sm text-gray-500 hover:text-gray-800 mt-3">
              ← Back to cart
            </Link>
          </div>
        </div>
      </form>
    </section>
  );
}
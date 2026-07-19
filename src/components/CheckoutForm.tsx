'use client';

import { useState, useEffect } from 'react';
import type { CartItem, OrderType } from '@/types';
import { ShieldAlert, Truck, Store } from 'lucide-react';

type FulfillmentType = 'Delivery' | 'Pickup';

interface ShippingRate {
  id: number;
  name: string;
  locations: string;
  price: number;
  isActive: boolean;
}

interface CheckoutFormProps {
  items: CartItem[];
  orderType: OrderType;
  onSubmit: (form: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    isDelivery: boolean;
    deliveryAddress: string;
    deliveryLandmark: string;
    shippingRateId?: number;
    deliveryNotes: string;
  }) => Promise<{ orderNumber?: string } | void>;
  whatsappNumber?: string;
}

export default function CheckoutForm({
  items,
  orderType,
  onSubmit,
  whatsappNumber,
}: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('Delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<number | undefined>();
  const [loadingRates, setLoadingRates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const hasRxItems = items.some((i) => i.requiresPrescription);
  const label = orderType === 'Drug' ? 'Pharmacy' : 'Supermarket';

  const selectedRate = shippingRates.find((r) => r.id === selectedShippingId);
  const shippingCost = fulfillment === 'Delivery' ? selectedRate?.price ?? 0 : 0;
  const total = subtotal + shippingCost;

  // Fetch shipping rates once, used only when Delivery is selected
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) return;
    setLoadingRates(true);
    fetch(`${API_URL}/api/ShippingRate/all`)
      .then((r) => r.json())
      .then((data) => {
        const rates: ShippingRate[] = data?.data ?? data ?? [];
        setShippingRates(rates.filter((r) => r.isActive !== false));
      })
      .catch((err) => console.error('Failed to fetch shipping rates:', err))
      .finally(() => setLoadingRates(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fulfillment === 'Delivery' && !selectedShippingId) {
      setError('Please select a delivery location.');
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmit({
        customerName,
        customerPhone,
        customerEmail,
        isDelivery: fulfillment === 'Delivery',
        deliveryAddress: fulfillment === 'Delivery' ? deliveryAddress : '',
        deliveryLandmark: fulfillment === 'Delivery' ? deliveryLandmark : '',
        shippingRateId: fulfillment === 'Delivery' ? selectedShippingId : undefined,
        deliveryNotes,
      });
      if (result?.orderNumber) setOrderNumber(result.orderNumber);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsAppMessage = () => {
    const lines = [
      `Hello MiniquesCare, I'd like to place a ${label} order:`,
      '',
      ...items.map(
        (i) =>
          `• ${i.name} (${i.unit}) x${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`
      ),
      '',
      `Subtotal: ₦${subtotal.toLocaleString()}`,
      fulfillment === 'Delivery' && selectedRate
        ? `Delivery (${selectedRate.name}): ₦${selectedRate.price.toLocaleString()}`
        : 'Pickup from store',
      `Total: ₦${total.toLocaleString()}`,
      `Name: ${customerName}`,
      `Phone: ${customerPhone}`,
      fulfillment === 'Delivery' ? `Address: ${deliveryAddress}` : '',
    ].filter(Boolean);
    return encodeURIComponent(lines.join('\n'));
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
          style={{ background: '#f0fdf4', color: '#25D366' }}
        >
          ✓
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        {orderNumber && (
          <p className="text-sm text-gray-500 mb-2">
            Order reference: <span className="font-semibold text-gray-900">{orderNumber}</span>
          </p>
        )}
        <p className="text-gray-600 mb-6">
          Thank you for your order. We will contact you shortly to confirm{' '}
          {fulfillment === 'Delivery' ? 'delivery' : 'pickup'} details.
        </p>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${buildWhatsAppMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            Confirm on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h2>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery or Pickup</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                fulfillment === 'Delivery' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="fulfillment"
                value="Delivery"
                checked={fulfillment === 'Delivery'}
                onChange={() => setFulfillment('Delivery')}
                className="accent-green-600"
              />
              <Truck className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Delivery</p>
                <p className="text-xs text-gray-500">We deliver to your address</p>
              </div>
            </label>
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                fulfillment === 'Pickup' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="fulfillment"
                value="Pickup"
                checked={fulfillment === 'Pickup'}
                onChange={() => setFulfillment('Pickup')}
                className="accent-green-600"
              />
              <Store className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Pickup from Store</p>
                <p className="text-xs text-gray-500">Collect at no extra cost</p>
              </div>
            </label>
          </div>

          {fulfillment === 'Delivery' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Location *
                </label>
                <select
                  required
                  value={selectedShippingId ?? ''}
                  onChange={(e) => setSelectedShippingId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
                >
                  <option value="" disabled>
                    {loadingRates ? 'Loading locations...' : 'Select a delivery location'}
                  </option>
                  {shippingRates.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.name} ({rate.locations}) — ₦{rate.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark (optional)
                </label>
                <input
                  value={deliveryLandmark}
                  onChange={(e) => setDeliveryLandmark(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  placeholder="Nearby landmark"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                  placeholder="Delivery instructions, landmarks, etc."
                />
              </div>
            </div>
          )}
        </div>

        {hasRxItems && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Prescription Required</p>
              <p className="text-sm text-amber-700 mt-1">
                Your order includes prescription medications. Our pharmacist will contact you to verify
                your prescription before dispatch.
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
              <span>{fulfillment === 'Delivery' ? 'Delivery Fee' : 'Pickup'}</span>
              <span>
                {fulfillment === 'Delivery'
                  ? selectedRate
                    ? `₦${selectedRate.price.toLocaleString()}`
                    : '—'
                  : 'Free'}
              </span>
            </div>
          </div>

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
            disabled={loading || items.length === 0}
            className="w-full py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#25D366' }}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </form>
  );
}
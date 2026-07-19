'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import CheckoutForm from '@/components/CheckoutForm';
import { cartApi, storeApi } from '@/lib/api';
import type { ApiResponse } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function PharmacyCheckoutPage() {
  const router = useRouter();
  const { getItemsByType, clearType, loading, cartId } = useCart();
  const items = getItemsByType('drug');
  const [whatsappNumber, setWhatsappNumber] = useState<string>();

  useEffect(() => {
    if (!loading && items.length === 0) {
      router.replace('/cart');
    }
  }, [loading, items.length, router]);

  useEffect(() => {
    storeApi
      .get()
      .then((res: ApiResponse<{ whatsapp?: string }>) => {
        if (res.success && res.data?.whatsapp) {
          setWhatsappNumber(res.data.whatsapp.replace(/[^0-9]/g, ''));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (form: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    isDelivery: boolean;
    deliveryAddress: string;
    deliveryLandmark: string;
    shippingRateId?: number;
    deliveryNotes: string;
  }) => {
    if (!cartId) {
      throw new Error('Cart not ready yet. Please try again in a moment.');
    }

    // No item-sync needed here — every "Add to Cart" click already wrote to
    // the server-side cart via CartContext. Checkout just reads that cart,
    // identified explicitly by cartId (not cookies).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await cartApi.checkout({
      cartId,
      email: form.customerEmail || undefined,
      fullName: form.customerName,
      phoneNumber: form.customerPhone,
      isDelivery: form.isDelivery,
      delivery: form.isDelivery
        ? {
            address: form.deliveryAddress,
            landmark: form.deliveryLandmark,
            shippingRateId: form.shippingRateId,
          }
        : undefined,
      orderNotes: form.deliveryNotes || undefined,
    });

    if (!res.success) {
      throw new Error(res.message || 'Failed to place order');
    }

    // IMPORTANT: your backend's CheckoutAsync only initializes a Paystack
    // payment — it returns an authorizationUrl and does NOT clear the cart
    // or finalize the order. The order only completes once Paystack calls
    // your webhook (HandlePaymentSuccessAsync). So the correct next step is
    // to send the customer to Paystack, not to show a local success screen.
    if (res.data?.authorizationUrl) {
      window.location.href = res.data.authorizationUrl;
      // Cart is intentionally NOT cleared here — it only clears once payment
      // actually succeeds server-side. Clearing it now would lose the order
      // if the customer abandons or fails payment on Paystack's page.
      return { orderNumber: res.data?.reference };
    }

    // Fallback in case a future flow returns without a payment step.
    await clearType('drug');
    return { orderNumber: res.data?.reference };
  };

  if (loading || items.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pharmacy Checkout</h1>
      <p className="text-gray-500 mb-8">Complete your order for pharmacy items.</p>
      <CheckoutForm
        items={items}
        orderType="Drug"
        onSubmit={handleSubmit}
        whatsappNumber={whatsappNumber}
      />
    </section>
  );
}
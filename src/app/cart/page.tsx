'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { EmptyState, Spinner } from '@/components/ui';
import { Minus, Plus, Trash2, Pill, ShoppingBasket, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, loading, error, updateQuantity, removeItem, getSubtotal } = useCart();

  if (loading) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>
        <Spinner />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>
        <EmptyState message="Your cart is empty. Browse our pharmacy or supermarket to add items." />
        <div className="flex gap-4 justify-center mt-6">
          <Link href="/pharmacy" className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#25D366' }}>
            Browse Pharmacy
          </Link>
          <Link href="/supermarket" className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50">
            Browse Supermarket
          </Link>
        </div>
      </section>
    );
  }

  const subtotal = getSubtotal();

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        <span className="text-sm text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {items.map((item) => {
            const Icon = item.type === 'drug' ? Pill : ShoppingBasket;
            const color = item.type === 'drug' ? '#25D366' : '#128C7E';
            return (
              <div key={`${item.type}-${item.id}`} className="px-6 py-4 flex gap-4 items-center">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-50 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                      title={item.type === 'drug' ? 'Pharmacy' : 'Supermarket'}
                    />
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  </div>
                  {item.unit && <p className="text-xs text-gray-400 ml-4">{item.unit}</p>}
                  <p className="text-sm font-semibold text-gray-900 mt-1 ml-4">
                    ₦{item.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => item.cartItemId && updateQuantity(item.cartItemId, item.quantity - 1)}
                    disabled={!item.cartItemId}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => item.cartItemId && updateQuantity(item.cartItemId, item.quantity + 1)}
                    disabled={!item.cartItemId}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => item.cartItemId && removeItem(item.cartItemId)}
                    disabled={!item.cartItemId}
                    className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center ml-1 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Subtotal</p>
            <p className="text-lg font-bold text-gray-900">₦{subtotal.toLocaleString()}</p>
          </div>
          <Link
            href="/checkout"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 flex items-center gap-1.5"
            style={{ background: '#25D366' }}
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-6">
        <Link href="/pharmacy" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Continue shopping in Pharmacy
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/supermarket" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Continue shopping in Supermarket →
        </Link>
      </div>
    </section>
  );
}
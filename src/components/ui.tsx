'use client';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, MessageCircle, Tag, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

/* ─── Badge ──────────────────────────────────────────────────────────────── */
export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'green';
}) {
  const classes = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-700',
    green: 'text-white',
  };
  return (
    <span
      className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', classes[variant])}
      style={variant === 'green' ? { background: '#25D366' } : undefined}
    >
      {children}
    </span>
  );
}

/* ─── Product Card ───────────────────────────────────────────────────────── */
interface ProductCardProps {
  id?: number;
  type?: 'drug' | 'product';
  name: string;
  category?: string;
  price: number;
  imageUrl?: string;
  availability?: string;
  prescription?: boolean;
  tag?: string;
  whatsapp?: string; // This should come from the store
  description?: string;
  href?: string; // Override the auto-generated detail link if needed
}

export function ProductCard({
  id,
  type = 'product',
  name,
  category,
  price,
  imageUrl,
  availability,
  prescription,
  tag,
  description,
  whatsapp,
  href,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');

  const available = !availability || availability === 'Available';
  const waText = encodeURIComponent(`Hello MiniquesCare, I'm interested in: ${name} (₦${price.toLocaleString()})`);

  // Card is clickable through to the product detail page whenever we have
  // an id (or an explicit href override).
  const detailHref = href ?? (id != null ? (type === 'drug' ? `/pharmacy/${id}` : `/supermarket/${id}`) : undefined);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (id == null || status === 'adding' || !available) return;
    setStatus('adding');
    try {
      await addItem({ id, type, name, price, unit: '', imageUrl });
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setStatus('idle');
    }
  };

  const imageBlock = (
    <div className="relative h-44 bg-gray-50 overflow-hidden">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-gray-200" />
        </div>
      )}
      {prescription && (
        <div className="absolute top-2 left-2">
          <Badge variant="warning">Rx Required</Badge>
        </div>
      )}
      {!available && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <Badge variant="danger">Out of Stock</Badge>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      {detailHref ? <Link href={detailHref}>{imageBlock}</Link> : imageBlock}

      <div className="p-4">
        {category && (
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {category}
          </p>
        )}

        {detailHref ? (
          <Link href={detailHref}>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 hover:underline">
              {name}
            </h3>
          </Link>
        ) : (
          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{name}</h3>
        )}

        {description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{description}</p>
        )}
        {tag && <p className="text-xs text-gray-400 mb-2">{tag}</p>}

        <span className="font-bold text-gray-900 block mt-2 mb-3">₦{price.toLocaleString()}</span>

        <div className="space-y-2">
          {id != null && (
            <button
              onClick={handleAddToCart}
              disabled={!available || status === 'adding'}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: status === 'added' ? '#128C7E' : '#25D366' }}
            >
              {status === 'added' ? (
                <>
                  <Check className="w-3 h-3" /> Added
                </>
              ) : status === 'adding' ? (
                'Adding…'
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" /> Add to Cart
                </>
              )}
            </button>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#25D366', color: '#25D366' }}
            >
              <MessageCircle className="w-3 h-3" />
              Enquire
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
/* ─── Search Bar ─────────────────────────────────────────────────────────── */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
        style={{ '--tw-ring-color': '#25D366' } as React.CSSProperties}
      />
    </div>
  );
}

/* ─── Category Pill ──────────────────────────────────────────────────────── */
export function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
        active
          ? 'text-white border-transparent'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
      )}
      style={active ? { background: '#25D366', borderColor: '#25D366' } : undefined}
    >
      {label}
    </button>
  );
}

/* ─── Page Hero ──────────────────────────────────────────────────────────── */
export function PageHero({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle: string;
  image?: string;
}) {
  return (
    <section
      className="relative py-16 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}
    >
      {image && (
        <div className="absolute inset-0">
          <Image src={image} alt="" fill className="object-cover opacity-10" />
        </div>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
      </div>
    </section>
  );
}

/* ─── Loading Spinner ─────────────────────────────────────────────────────── */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#25D366', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */
export function EmptyState({ message = 'No results found.' }: { message?: string }) {
  return (
    <div className="py-20 text-center text-gray-400">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ─── Pagination ─────────────────────────────────────────────────────────── */
export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
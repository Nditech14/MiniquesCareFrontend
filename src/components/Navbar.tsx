'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Cross, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '@/context/CartContext';

const links = [
  { href: '/', label: 'Home' },
  { href: '/pharmacy', label: 'Pharmacy' },
  { href: '/laboratory', label: 'Laboratory' },
  { href: '/supermarket', label: 'Supermarket' }
];

export default function Navbar({phoneNumber}:{phoneNumber?:string}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname.startsWith('/admin');
  const { itemCount } = useCart();

  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#25D366' }}>
              <Cross className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900">
              Miniques<span style={{ color: '#25D366' }}>Care</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                style={
                  pathname === link.href
                    ? { background: '#25D366' }
                    : undefined
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Cart + CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ background: '#25D366' }}
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
            <a
              href={`https://wa.me/${phoneNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat with Us
          </a>
          </div>

          {/* Mobile toggle + cart */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/cart" className="relative p-2 rounded-lg text-gray-600">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: '#25D366' }}
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-50"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={clsx(
                'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
              style={pathname === link.href ? { background: '#25D366' } : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
          <a
          href={`https://wa.me/${phoneNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#25D366' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}

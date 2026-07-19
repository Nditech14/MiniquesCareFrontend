'use client';

import Link from 'next/link';
import { Pill, FlaskConical, ShoppingBasket, FileText, Tag, Store, ArrowRight, BarChart3, ClipboardList, User } from 'lucide-react';

const quickLinks = [
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList, desc: 'View and manage customer orders', color: '#25D366' },
  { href: '/admin/drugs', label: 'Manage Drugs', icon: Pill, desc: 'Add, edit, and manage pharmacy stock', color: '#128C7E' },
  { href: '/admin/laboratory', label: 'Lab Tests', icon: FlaskConical, desc: 'Manage diagnostic tests and pricing', color: '#128C7E' },
  { href: '/admin/supermarket', label: 'Supermarket', icon: ShoppingBasket, desc: 'Manage products and categories', color: '#075E54' },
  { href: '/admin/blogs', label: 'Blog Posts', icon: FileText, desc: 'Write and publish health articles', color: '#25D366' },
  { href: '/admin/categories', label: 'Categories', icon: Tag, desc: 'Organise drug, lab, supermarket categories', color: '#128C7E' },
  { href: '/admin/store-info', label: 'Store Info', icon: Store, desc: 'Update contact details, hours, social links', color: '#075E54' },
  { href: '/admin/profile', label: 'Profile', icon: User, desc: 'Update email, password, and profile image', color: '#25D366' },
];

export default function AdminDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back. Manage your store from here.</p>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color }}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
          </Link>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5" style={{ color: '#25D366' }} />
          <h2 className="font-semibold text-gray-900">Getting Started</h2>
        </div>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: '#25D366' }}>1</span>
            Set up your <Link href="/admin/store-info" className="font-medium underline" style={{ color: '#25D366' }}>Store Info</Link> — address, phone, hours, WhatsApp number.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: '#25D366' }}>2</span>
            Create <Link href="/admin/categories" className="font-medium underline" style={{ color: '#25D366' }}>Categories</Link> for Drugs, Lab Tests, and Supermarket products.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: '#25D366' }}>3</span>
            Start adding <Link href="/admin/drugs" className="font-medium underline" style={{ color: '#25D366' }}>Drugs</Link>, <Link href="/admin/laboratory" className="font-medium underline" style={{ color: '#25D366' }}>Lab Tests</Link>, and <Link href="/admin/supermarket" className="font-medium underline" style={{ color: '#25D366' }}>Products</Link>.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: '#25D366' }}>4</span>
            Publish <Link href="/admin/blogs" className="font-medium underline" style={{ color: '#25D366' }}>Blog posts</Link> to share health tips with customers.
          </li>
        </ul>
      </div>
    </div>
  );
}

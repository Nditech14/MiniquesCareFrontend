'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Stethoscope } from 'lucide-react';

const DISMISS_KEY = 'mc_seen_pharmacist_popup';
const SHOW_DELAY_MS = 2200;

export default function PharmacistPopup() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false); // drives the enter/exit transition

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const timer = setTimeout(() => {
      setOpen(true);
      requestAnimationFrame(() => setVisible(true));
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
    setTimeout(() => setOpen(false), 200);
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pharmacist-popup-title"
        className={`relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 transition-all duration-200 ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-95'
        }`}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
          style={{ background: '#f0fdf4' }}
        >
          <Stethoscope className="w-6 h-6" style={{ color: '#25D366' }} />
        </div>

        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
          style={{ borderColor: '#25D366', color: '#128C7E', background: '#f0fdf4' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#25D366' }} />
          Virtual Consultations
        </div>

        <h2
          id="pharmacist-popup-title"
          className="font-display text-2xl font-bold text-gray-900 mb-2 leading-snug"
        >
          Get expert advice without leaving home
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Book a one-on-one video session with a trained pharmacist — ask about symptoms,
          medications, or dosages, and get answers you can trust in minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/consultation"
            onClick={close}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            Book a Session
          </Link>
          <button
            onClick={close}
            className="px-5 py-3 rounded-xl font-medium text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
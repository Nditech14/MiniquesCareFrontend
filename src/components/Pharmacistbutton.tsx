'use client';

import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

export default function PharmacistButton() {
  return (
    <Link
      href="/consultation"
      aria-label="Speak with a pharmacist"
      className="fixed z-40 bottom-24 right-6 flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-full text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
      style={{ background: '#128C7E' }}
    >
      <span className="relative flex items-center justify-center w-6 h-6 shrink-0">
        <Stethoscope className="w-5 h-5" />
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2"
          style={{ background: '#25D366', boxShadow: '0 0 0 2px #128C7E' }}
        />
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">Speak with a Pharmacist</span>
    </Link>
  );
}
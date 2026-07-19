// Frontend-only invoice cache. Stores what the customer is buying at the
// moment checkout is submitted (items + breakdown), keyed by the payment
// reference. Read back on the confirmation page after Paystack redirects
// the customer back.
//
// Uses sessionStorage (same store as mc_pending_reference) since the
// Paystack redirect stays in the same tab/session. This is NOT the source
// of truth for payment status — that always comes from
// GET /api/Payment/verify/{reference}. It only supplies display detail
// (what was bought) for the confirmation page.

import type { CartBreakdown } from './api';

export interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface InvoiceSnapshot {
  reference: string;
  items: InvoiceItem[];
  breakdown: CartBreakdown;
  customerEmail: string;
  customerPhoneNumber: string;
  createdAt: string;
}

const PREFIX = 'mc_invoice_';

export function saveInvoiceSnapshot(snapshot: InvoiceSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PREFIX + snapshot.reference, JSON.stringify(snapshot));
  } catch (err) {
    console.error('Failed to cache invoice snapshot:', err);
  }
}

export function getInvoiceSnapshot(reference: string): InvoiceSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + reference);
    return raw ? (JSON.parse(raw) as InvoiceSnapshot) : null;
  } catch {
    return null;
  }
}

export function removeInvoiceSnapshot(reference: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PREFIX + reference);
  } catch {
    // ignore
  }
}
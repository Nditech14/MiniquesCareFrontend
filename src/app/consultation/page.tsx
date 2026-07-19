'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const BRAND = '#25D366';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Consultation {
  id: number;
  title: string;
  bookingType: string;
  fee: number;
  description?: string;
  isActive: boolean;
}

interface AvailabilitySlot {
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  isAvailable: boolean;
}

type Step = 'consultation' | 'datetime' | 'details' | 'paying';

interface ContactDetails {
  customerName: string;
  customerEmail: string;
  customerPhoneNumber: string;
  notes: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Some endpoints wrap payloads as { success, data }, others (like Payment/verify)
// return flat fields. Falling back to the raw json covers both.
async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    const message = json?.detail || json?.title || json?.message || 'Request failed';
    throw new Error(message);
  }
  return (json?.data ?? json) as T;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isPastDay(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

// Sunday-start 6-row calendar grid for the given month.
function buildCalendarMatrix(month: Date): Date[][] {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// The range endpoint's exact shape isn't specified in the API docs.
// This normalizer accepts either:
//   A) [{ date, slots: AvailabilitySlot[] }]
//   B) a flat list of { date, startTime, endTime, isAvailable }
// and produces a { "YYYY-MM-DD": AvailabilitySlot[] } map either way.
function normalizeRangeAvailability(raw: unknown): Record<string, AvailabilitySlot[]> {
  const map: Record<string, AvailabilitySlot[]> = {};
  if (!Array.isArray(raw)) return map;

  for (const entry of raw as Record<string, unknown>[]) {
    const dateKey = String(entry.date ?? entry.day ?? '').slice(0, 10);
    if (!dateKey) continue;

    if (Array.isArray(entry.slots)) {
      map[dateKey] = entry.slots as AvailabilitySlot[];
    } else if (entry.startTime) {
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({
        startTime: entry.startTime as string,
        endTime: entry.endTime as string,
        isAvailable: Boolean(entry.isAvailable),
      });
    }
  }
  return map;
}

function currency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function Consult() {
  const [step, setStep] = useState<Step>('consultation');

  // Consultation list
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // Calendar / availability
  const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(new Date()));
  const [monthAvailability, setMonthAvailability] = useState<Record<string, AvailabilitySlot[]>>(
    {}
  );
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Contact details
  const [contact, setContact] = useState<ContactDetails>({
    customerName: '',
    customerEmail: '',
    customerPhoneNumber: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* -------------------------- Load consultations ------------------- */

  useEffect(() => {
    const load = async () => {
      setLoadingConsultations(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/Consultation`);
        const data = await unwrap<Consultation[]>(res);
        setConsultations((data || []).filter((c) => c.isActive));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load consultations");
      } finally {
        setLoadingConsultations(false);
      }
    };
    load();
  }, []);

  /* -------------------------- Load month availability --------------*/

  useEffect(() => {
    if (step !== 'datetime') return;
    const load = async () => {
      setLoadingMonth(true);
      setError(null);
      try {
        const start = startOfMonth(visibleMonth);
        const end = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
        const res = await fetch(
          `${getApiBaseUrl()}/api/availability/range?startDate=${toISODate(start)}&endDate=${toISODate(
            end
          )}`
        );
        const data = await unwrap<unknown>(res);
        setMonthAvailability(normalizeRangeAvailability(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load availability");
        setMonthAvailability({});
      } finally {
        setLoadingMonth(false);
      }
    };
    load();
  }, [step, visibleMonth]);

  const calendarWeeks = useMemo(() => buildCalendarMatrix(visibleMonth), [visibleMonth]);
  const selectedDaySlots = selectedDateKey ? monthAvailability[selectedDateKey] || [] : [];

  /* -------------------------- Actions -------------------------------*/

  function chooseConsultation(c: Consultation) {
    setSelectedConsultation(c);
    setStep('datetime');
  }

  function pickDay(d: Date) {
    if (isPastDay(d) || !isSameMonth(d, visibleMonth)) return;
    setSelectedDateKey(toISODate(d));
    setSelectedSlot(null);
  }

  function confirmDateTime() {
    if (!selectedSlot) return;
    setStep('details');
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConsultation || !selectedSlot || !selectedDateKey) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the booking
      const bookingRes = await fetch(`${getApiBaseUrl()}/api/Booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: contact.customerEmail,
          customerPhoneNumber: contact.customerPhoneNumber,
          customerName: contact.customerName,
          consultationId: selectedConsultation.id,
          bookingDate: selectedDateKey,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          notes: contact.notes || undefined,
        }),
      });
      const booking = await unwrap<{ id: number }>(bookingRes);

      // 2. Kick off payment for the booking fee
      setStep('paying');
      const paymentRes = await fetch(`${getApiBaseUrl()}/api/Payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: contact.customerEmail,
          customerPhoneNumber: contact.customerPhoneNumber,
          amount: selectedConsultation.fee,
          paymentType: 'consultation',
          referenceEntityId: booking.id,
          currency: 'NGN',
        }),
      });
      const payment = await unwrap<{
        authorizationUrl?: string;
        reference?: string;
      }>(paymentRes);

      if (payment.reference) {
        sessionStorage.setItem('mc_pending_consultation_reference', payment.reference);
      }

      if (!payment.authorizationUrl) {
        throw new Error('Payment could not be started. Please try again.');
      }
      window.location.href = payment.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStep('details');
    } finally {
      setSubmitting(false);
    }
  }

  /* -------------------------- Render ---------------------------------*/

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: BRAND }}>
          Talk to someone about your health
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Book a consultation</h1>
      </div>

      <Stepper step={step} />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {step === 'consultation' && (
        <div className="space-y-3">
          {loadingConsultations && <SkeletonList />}
          {!loadingConsultations && consultations.length === 0 && (
            <p className="text-center text-sm text-gray-500">
              No consultations are available right now.
            </p>
          )}
          {consultations.map((c) => (
            <button
              key={c.id}
              onClick={() => chooseConsultation(c)}
              className="w-full flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left transition hover:shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-900">{c.title}</p>
                {c.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                )}
              </div>
              <span className="ml-4 shrink-0 font-bold" style={{ color: BRAND }}>
                {currency(c.fee)}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 'datetime' && selectedConsultation && (
        <div>
          <SelectedSummary consultation={selectedConsultation} onChange={() => setStep('consultation')} />

          <Calendar
            visibleMonth={visibleMonth}
            weeks={calendarWeeks}
            availability={monthAvailability}
            loading={loadingMonth}
            selectedDateKey={selectedDateKey}
            onPrevMonth={() => setVisibleMonth(addMonths(visibleMonth, -1))}
            onNextMonth={() => setVisibleMonth(addMonths(visibleMonth, 1))}
            onPickDay={pickDay}
          />

          {selectedDateKey && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Times for{' '}
                {new Date(selectedDateKey).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>

              {loadingMonth && <SkeletonGrid />}

              {!loadingMonth && selectedDaySlots.length === 0 && (
                <p className="text-sm text-gray-500">No slots configured for this day.</p>
              )}

              {!loadingMonth && selectedDaySlots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedDaySlots.map((s) => {
                    const active = selectedSlot?.startTime === s.startTime;
                    return (
                      <button
                        key={s.startTime}
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlot(s)}
                        className="rounded-xl border px-2 py-2 text-sm transition"
                        style={
                          !s.isAvailable
                            ? { borderColor: '#f3f4f6', background: '#f9fafb', color: '#d1d5db' }
                            : active
                            ? { borderColor: BRAND, background: BRAND, color: '#fff' }
                            : { borderColor: '#e5e7eb', background: '#fff', color: '#374151' }
                        }
                      >
                        <span className={!s.isAvailable ? 'line-through' : ''}>
                          {formatTime(s.startTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-gray-200 bg-white" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gray-100" />
                  Taken
                </span>
              </div>
            </div>
          )}

          <button
            onClick={confirmDateTime}
            disabled={!selectedSlot}
            className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition disabled:cursor-not-allowed disabled:text-gray-400"
            style={{ background: selectedSlot ? BRAND : '#e5e7eb' }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'details' && selectedConsultation && selectedSlot && selectedDateKey && (
        <form onSubmit={submitBooking}>
          <SelectedSummary
            consultation={selectedConsultation}
            dateKey={selectedDateKey}
            slot={selectedSlot}
            onChange={() => setStep('datetime')}
          />

          <div className="mt-6 space-y-4">
            <Field label="Full name">
              <input
                required
                type="text"
                value={contact.customerName}
                onChange={(e) => setContact({ ...contact, customerName: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Email address">
              <input
                required
                type="email"
                value={contact.customerEmail}
                onChange={(e) => setContact({ ...contact, customerEmail: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                type="tel"
                value={contact.customerPhoneNumber}
                onChange={(e) => setContact({ ...contact, customerPhoneNumber: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Anything you'd like the doctor to know? (optional)">
              <textarea
                value={contact.notes}
                onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                rows={3}
                className="input resize-none"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {submitting ? 'Booking...' : `Pay ${currency(selectedConsultation.fee)} & book`}
          </button>
        </form>
      )}

      {step === 'paying' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: BRAND }} />
          <p className="text-sm text-gray-500 mt-4">Taking you to a secure payment page...</p>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: ${BRAND};
          box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.15);
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

function Calendar({
  visibleMonth,
  weeks,
  availability,
  loading,
  selectedDateKey,
  onPrevMonth,
  onNextMonth,
  onPickDay,
}: {
  visibleMonth: Date;
  weeks: Date[][];
  availability: Record<string, AvailabilitySlot[]>;
  loading: boolean;
  selectedDateKey: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDay: (d: Date) => void;
}) {
  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-bold text-gray-900">
          {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {weekdayLabels.map((w, i) => (
          <div key={i} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((d, i) => {
          const dateKey = toISODate(d);
          const inMonth = isSameMonth(d, visibleMonth);
          const past = isPastDay(d);
          const daySlots = availability[dateKey];
          const hasData = !loading && inMonth && !past && daySlots !== undefined;
          const availableCount = daySlots?.filter((s) => s.isAvailable).length ?? 0;
          const isFull = hasData && daySlots!.length > 0 && availableCount === 0;
          const isOpen = hasData && availableCount > 0;
          const isClosed = hasData && daySlots!.length === 0;
          const selected = dateKey === selectedDateKey;
          const disabled = past || !inMonth || isClosed;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onPickDay(d)}
              className="flex flex-col items-center rounded-lg py-2 text-sm transition"
              style={
                selected
                  ? { background: BRAND, color: '#fff' }
                  : !inMonth
                  ? { color: '#e5e7eb' }
                  : disabled
                  ? { color: '#d1d5db', cursor: 'not-allowed' }
                  : { color: '#374151' }
              }
            >
              <span>{d.getDate()}</span>
              {inMonth && !past && (
                <span
                  className="mt-1 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: selected
                      ? '#fff'
                      : isOpen
                      ? BRAND
                      : isFull
                      ? '#d1d5db'
                      : 'transparent',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          Slots open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          Fully booked
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'consultation', label: 'Type' },
    { key: 'datetime', label: 'Time' },
    { key: 'details', label: 'Details' },
    { key: 'paying', label: 'Pay' },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
              style={
                i <= activeIndex
                  ? { background: BRAND, color: '#fff' }
                  : { background: '#e5e7eb', color: '#6b7280' }
              }
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i <= activeIndex ? 'text-gray-800' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function SelectedSummary({
  consultation,
  dateKey,
  slot,
  onChange,
}: {
  consultation: Consultation;
  dateKey?: string;
  slot?: AvailabilitySlot;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="text-sm">
        <p className="font-medium text-gray-900">{consultation.title}</p>
        <p className="text-gray-500">
          {currency(consultation.fee)}
          {dateKey && slot && (
            <>
              {' '}
              &middot;{' '}
              {new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
              {formatTime(slot.startTime)}
            </>
          )}
        </p>
      </div>
      <button type="button" onClick={onChange} className="text-sm font-semibold" style={{ color: BRAND }}>
        Change
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}
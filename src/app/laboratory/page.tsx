'use client';

import { useEffect, useState, useCallback } from 'react';
import { labApi, categoriesApi } from '@/lib/api';
import type { LabTest, Category, PagedResult, ApiResponse } from '@/types';
import {
  PageHero,
  SearchBar,
  CategoryPill,
  Spinner,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { MessageCircle, FlaskConical, Clock, Droplets, X } from 'lucide-react';

// Map numeric sampleType back to label
const sampleTypeLabels: Record<number | string, string> = {
  0: 'Blood', 1: 'Urine', 2: 'Stool', 3: 'Swab', 4: 'Sputum', 5: 'Other',
  Blood: 'Blood', Urine: 'Urine', Stool: 'Stool',
  Swab: 'Swab', Sputum: 'Sputum', Other: 'Other',
};

// Lab Test Detail Modal
function LabTestModal({
  test,
  onClose,
  phoneNumber,
}: {
  test: LabTest;
  onClose: () => void;
  phoneNumber?: string;
}) {
  const sampleLabel =
    typeof test.sampleType === 'number'
      ? sampleTypeLabels[test.sampleType]
      : test.sampleType;

  const waText = encodeURIComponent(
    `Hello MiniquesCare, I'd like to book a lab test: ${test.name} — ₦${test.price.toLocaleString()}`
  );
  const waHref = phoneNumber ? `https://wa.me/${phoneNumber}?text=${waText}` : '#';

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-start z-10">
          <div className="pr-8">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{test.categoryName}</p>
            <h2 className="text-xl font-bold text-gray-900">{test.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-0.5 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Price + Sample badges */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-3xl font-bold text-gray-900">
              ₦{test.price.toLocaleString()}
            </span>
            {sampleLabel && (
              <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                <Droplets className="w-3.5 h-3.5" />
                {sampleLabel} sample
              </span>
            )}
          </div>

          {/* Turnaround */}
          {test.turnaroundTime && (
            <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-3 rounded-lg">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-600">
                Results ready in <span className="font-medium text-gray-900">{test.turnaroundTime}</span>
              </span>
            </div>
          )}

          {/* Description */}
          {test.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">About this test</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {test.description}
              </p>
            </div>
          )}

          {/* Preparation */}
          {test.preparation && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-1.5">
                How to prepare
              </h3>
              <p className="text-sm text-amber-700 leading-relaxed whitespace-pre-wrap">
                {test.preparation}
              </p>
            </div>
          )}

          {/* Book via WhatsApp */}
          <button
            onClick={() => phoneNumber && window.open(waHref, '_blank')}
            disabled={!phoneNumber}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-base transition-all ${
              phoneNumber
                ? 'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ background: '#25D366' }}
          >
            <MessageCircle className="w-5 h-5" />
            Book via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// Lab Test Card
function LabTestCard({
  test,
  onSelect,
}: {
  test: LabTest;
  onSelect: (test: LabTest) => void;
}) {
  const sampleLabel =
    typeof test.sampleType === 'number'
      ? sampleTypeLabels[test.sampleType]
      : test.sampleType;

  return (
    <button
      onClick={() => onSelect(test)}
      className="group w-full text-left bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Category + Sample type */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide truncate">
          {test.categoryName}
        </span>
        {sampleLabel && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
            {sampleLabel}
          </span>
        )}
      </div>

      {/* Test name */}
      <h3 className="font-semibold text-gray-900 mb-1 leading-snug group-hover:text-teal-700 transition-colors">
        {test.name}
      </h3>

      {/* Turnaround */}
      {test.turnaroundTime && (
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
          <Clock className="w-3 h-3" />
          {test.turnaroundTime}
        </p>
      )}

      {/* Price */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <span className="font-bold text-gray-900">₦{test.price.toLocaleString()}</span>
        <span className="text-xs text-teal-600 font-medium group-hover:underline">
          View details →
        </span>
      </div>
    </button>
  );
}

export default function LaboratoryPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const pageSize = 20;

  // Fetch WhatsApp number
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7067';
    fetch(`${API_URL}/api/v1/store-info`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.whatsapp) {
          setPhoneNumber(data.data.whatsapp.replace(/[^0-9]/g, ''));
        }
      })
      .catch(console.error);
  }, []);

  // Fetch categories
  useEffect(() => {
    categoriesApi.getAll('Lab').then((res) => {
      const r = res as ApiResponse<Category[]>;
      if (r.success && r.data) setCategories(r.data);
    }).catch(console.error);
  }, []);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await labApi.getAll(
        page,
        pageSize,
        categoryId,
        undefined,
        search
      )) as ApiResponse<PagedResult<LabTest>>;
      if (res.success && res.data) {
        setTests(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch lab tests:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryId, search]);

  useEffect(() => {
    const t = setTimeout(fetchTests, 300);
    return () => clearTimeout(t);
  }, [fetchTests]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const whatsappMessage = encodeURIComponent(
    'Hello MiniquesCare! I would like to enquire about your laboratory tests.'
  );
  const whatsappLink = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${whatsappMessage}`
    : '#';

  return (
    <>
      <PageHero
        title="Laboratory Services"
        subtitle="Accurate diagnostics, fast results. Book your lab tests with ease — walk in or enquire via WhatsApp."
        image="https://res.cloudinary.com/danksdxj8/image/upload/v1774452271/biologist-woman-examining-biological-slide-medical-expertise-using-microscope_xo2jc3.jpg"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search + Chat Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex-1 max-w-md w-full">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search tests, e.g. Full Blood Count..."
            />
          </div>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-sm ${
              phoneNumber
                ? 'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
                : 'opacity-50 cursor-not-allowed pointer-events-none'
            }`}
            style={{ background: '#25D366' }}
            onClick={(e) => !phoneNumber && e.preventDefault()}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enquire via WhatsApp</span>
          </a>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <CategoryPill
            label="All Tests"
            active={!categoryId}
            onClick={() => { setCategoryId(undefined); setPage(1); }}
          />
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.name}
              active={categoryId === c.id}
              onClick={() => { setCategoryId(c.id); setPage(1); }}
            />
          ))}
        </div>

        {/* Results count */}
        {!loading && tests.length > 0 && (
          <p className="text-sm text-gray-500 mb-6">
            {totalCount.toLocaleString()} test{totalCount !== 1 ? 's' : ''} available
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : tests.length === 0 ? (
          <EmptyState
            message={
              search
                ? 'No tests match your search.'
                : 'No lab tests available at the moment.'
            }
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {tests.map((test) => (
                <LabTestCard
                  key={test.id}
                  test={test}
                  onSelect={setSelectedTest}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination page={page} totalPages={totalPages} onPage={setPage} />
              </div>
            )}
          </>
        )}
      </section>

      {/* Detail Modal */}
      {selectedTest && (
        <LabTestModal
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
          phoneNumber={phoneNumber}
        />
      )}
    </>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, X, MessageCircle, Package, ShoppingCart, Check } from 'lucide-react';
import { Badge, Spinner } from '@/components/ui';
import { drugsApi, supermarketApi } from '@/lib/api';
import { useCart } from '@/context/CartContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7067';

interface ImageInfo {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

// What the /api/spotlight list endpoint gives us
interface SpotlightItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  type: 'Drug' | 'Product';
}

// What drugsApi.getById / supermarketApi.getById give us
interface SpotlightDetail {
  id: number;
  name: string;
  price: number;
  categoryName?: string;
  brand?: string;
  unit?: string;
  availability?: string;
  description?: string;
  requiresPrescription?: boolean;
  images: ImageInfo[];
}

function normalizeSpotlightList(payload: any): SpotlightItem[] {
  if (!payload) return [];
  const raw = payload.data?.items ?? [];
  return raw.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl ?? undefined,
    type: p.type === 'Drug' ? 'Drug' : 'Product',
  }));
}

/* ─── Image Slideshow (same as Pharmacy/Supermarket) ────────────────────── */
function ImageSlideshow({ images, productName }: { images: ImageInfo[]; productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-80 bg-gray-100 flex items-center justify-center text-gray-400">
        No image available
      </div>
    );
  }

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative group">
      <div className="relative h-80 overflow-hidden rounded-lg bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex].url}
          alt={`${productName} - image ${currentIndex + 1}`}
          className="w-full h-full object-contain transition-opacity duration-300"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={`${productName} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Detail Modal (same layout as Pharmacy/Supermarket) ─────────────────── */
function SpotlightDetailModal({
  item,
  onClose,
  phoneNumber,
  onAddToCart,
  added,
}: {
  item: SpotlightDetail;
  onClose: () => void;
  phoneNumber?: string;
  onAddToCart: () => void;
  added: boolean;
}) {
  const waText = encodeURIComponent(
    `Hello MiniquesCare, I'd like to enquire about: ${item.name}${item.unit ? ` (${item.unit})` : ''} — ₦${item.price.toLocaleString()}`
  );
  const waHref = phoneNumber ? `https://wa.me/${phoneNumber}?text=${waText}` : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900 pr-8">{item.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <ImageSlideshow images={item.images} productName={item.name} />

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                {item.categoryName && <p className="text-sm text-gray-500 mb-1">{item.categoryName}</p>}
                <span className="text-3xl font-bold text-gray-900">₦{item.price.toLocaleString()}</span>
              </div>
              {item.availability && (
                <span
                  className={`text-sm px-3 py-1.5 rounded-full font-medium ${
                    item.availability === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {item.availability}
                </span>
              )}
            </div>

            {item.brand && (
              <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-700">Brand:</span>
                <span className="text-gray-600">{item.brand}</span>
              </div>
            )}

            {item.unit && (
              <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <Package className="w-4 h-4" />
                <span>Unit: {item.unit}</span>
              </div>
            )}

            {item.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={onAddToCart}
                disabled={item.availability !== undefined && item.availability !== 'Available'}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg transition-all ${
                  item.availability === undefined || item.availability === 'Available'
                    ? 'text-white hover:opacity-90'
                    : 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-600'
                }`}
                style={item.availability === undefined || item.availability === 'Available' ? { background: '#128C7E' } : undefined}
              >
                {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {added ? 'Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => phoneNumber && window.open(waHref, '_blank')}
                disabled={!phoneNumber}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-lg transition-all ${
                  phoneNumber ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ background: '#25D366' }}
              >
                <MessageCircle className="w-6 h-6" />
                Enquire on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Spotlight Card ──────────────────────────────────────────────────────── */
function SpotlightCard({
  item,
  phoneNumber,
  onAddToCart,
}: {
  item: SpotlightItem;
  phoneNumber?: string;
  onAddToCart: (item: SpotlightItem) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<SpotlightDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleViewDetails = async () => {
    setLoading(true);
    try {
      const res: any =
        item.type === 'Drug' ? await drugsApi.getById(item.id) : await supermarketApi.getById(item.id);
      if (res.success && res.data) {
        setDetail(res.data as SpotlightDetail);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to load spotlight item details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
        <div onClick={handleViewDetails}>
          <div className="relative bg-gray-50">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-44 flex items-center justify-center text-gray-300">
                <ShoppingCart className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="p-4">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{item.type}</p>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{item.name}</h3>
            <span className="font-bold text-gray-900">₦{item.price.toLocaleString()}</span>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleViewDetails}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors border border-blue-200 hover:border-blue-300"
          >
            {loading ? 'Loading...' : 'View Details'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(item);
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            className="px-3 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: added ? '#128C7E' : '#25D366' }}
            title="Add to cart"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showModal && detail && (
        <SpotlightDetailModal
          item={detail}
          onClose={() => setShowModal(false)}
          phoneNumber={phoneNumber}
          added={added}
          onAddToCart={() => {
            onAddToCart(item);
            setAdded(true);
          }}
        />
      )}
    </>
  );
}

/* ─── Section ─────────────────────────────────────────────────────────────── */
interface SpotlightDealsProps {
  phoneNumber?: string;
}

export default function SpotlightDeals({ phoneNumber }: SpotlightDealsProps) {
  const { addItem } = useCart();
  const [items, setItems] = useState<SpotlightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/spotlight?skip=0&take=10`)
      .then((r) => r.json())
      .then((data) => setItems(normalizeSpotlightList(data)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  const handleAddToCart = (item: SpotlightItem) => {
    addItem({
      id: item.id,
      type: item.type === 'Drug' ? 'drug' : 'product',
      name: item.name,
      price: item.price,
      unit: '',
      imageUrl: item.imageUrl,
    });
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="green">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Spotlight
              </span>
            </Badge>
            <h2 className="font-display text-3xl font-bold text-gray-900 mt-3">Today&apos;s Hot Picks</h2>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {items.map((item) => (
              <SpotlightCard key={`${item.type}-${item.id}`} item={item} phoneNumber={phoneNumber} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supermarketApi, categoriesApi } from '@/lib/api';
import type { SupermarketProduct, Category, PagedResult, ApiResponse } from '@/types';
import {
  PageHero,
  SearchBar,
  CategoryPill,
  Spinner,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { ChevronLeft, ChevronRight, X, MessageCircle, Package, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

// Image type matching your API response
interface ImageInfo {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

// Product detail with full images array
interface ProductDetail extends Omit<SupermarketProduct, 'images'> {
  images: ImageInfo[];
  description?: string;
}

// Image Slideshow Component
const ImageSlideshow = ({ images, productName }: { images: ImageInfo[]; productName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-80 bg-gray-100 flex items-center justify-center text-gray-400">
        No image available
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative group">
      <div className="relative h-80 overflow-hidden rounded-lg bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex].url}
          alt={`${productName} - image ${currentIndex + 1}`}
          className="w-full h-full object-contain transition-opacity duration-300"
        />
        
        {/* Navigation Arrows */}
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
        
        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === index 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Product Detail Modal
const ProductDetailModal = ({ 
  product, 
  onClose, 
  phoneNumber,
  onAddToCart,
  added,
}: { 
  product: ProductDetail; 
  onClose: () => void;
  phoneNumber?: string;
  onAddToCart: () => void;
  added: boolean;
}) => {
  const waText = encodeURIComponent(
    `Hello MiniquesCare, I'd like to enquire about: ${product.name} (${product.unit || 'item'}) — ₦${product.price.toLocaleString()}`
  );
  const waHref = phoneNumber ? `https://wa.me/${phoneNumber}?text=${waText}` : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900 pr-8">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          {/* Image Slideshow */}
          <ImageSlideshow images={product.images} productName={product.name} />
          
          {/* Product Details */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">{product.categoryName}</p>
                <span className="text-3xl font-bold text-gray-900">
                  ₦{product.price.toLocaleString()}
                </span>
              </div>
              <span
                className={`text-sm px-3 py-1.5 rounded-full font-medium ${
                  product.availability === 'Available'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {product.availability}
              </span>
            </div>
            
            {product.brand && (
              <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-700">Brand:</span>
                <span className="text-gray-600">{product.brand}</span>
              </div>
            )}
            
            {product.unit && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <Package className="w-4 h-4" />
                <span>Unit: {product.unit}</span>
              </div>
            )}
            
            {product.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
            
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={onAddToCart}
                disabled={product.availability !== 'Available'}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg transition-all ${
                  product.availability === 'Available'
                    ? 'text-white hover:opacity-90'
                    : 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-600'
                }`}
                style={product.availability === 'Available' ? { background: '#128C7E' } : undefined}
              >
                {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {added ? 'Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => {
                  if (phoneNumber) {
                    window.open(waHref, '_blank');
                  }
                }}
                disabled={!phoneNumber}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-lg transition-all ${
                  phoneNumber 
                    ? 'hover:opacity-90' 
                    : 'opacity-50 cursor-not-allowed'
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
};

// Enhanced Product Card Component
const EnhancedProductCard = ({ 
  product, 
  phoneNumber, 
  onProductClick,
  onAddToCart,
}: { 
  product: SupermarketProduct; 
  phoneNumber?: string;
  onProductClick: (productId: number) => Promise<ProductDetail>;
  onAddToCart: (product: SupermarketProduct) => void;
}) => {
  const [showModal, setShowModal] = useState(false);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleViewDetails = async () => {
    setLoading(true);
    try {
      const detail = await onProductClick(product.id);
      setProductDetail(detail);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load product details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle images - ensure we have the correct structure
  const images = product.images as ImageInfo[] | undefined;
  const imageUrl = images?.[0]?.url;
  const hasMultipleImages = images && images.length > 1;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
        <div onClick={handleViewDetails}>
          {/* Image Section */}
          <div className="relative bg-gray-50">
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imageUrl} 
                  alt={product.name} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {hasMultipleImages && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {images.length} photos
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          
          <div className="p-4">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{product.categoryName}</p>
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 mb-1">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-xs text-gray-400 mb-2">by {product.brand}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-gray-900 text-lg">₦{product.price.toLocaleString()}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  product.availability === 'Available'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {product.availability}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleViewDetails}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border border-blue-200 hover:border-blue-300"
          >
            {loading ? 'Loading...' : 'View Details'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (product.availability === 'Available') {
                onAddToCart(product);
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }
            }}
            disabled={product.availability !== 'Available'}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: added ? '#128C7E' : '#25D366' }}
            title="Add to cart"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showModal && productDetail && (
        <ProductDetailModal
          product={productDetail}
          onClose={() => setShowModal(false)}
          phoneNumber={phoneNumber}
          added={added}
          onAddToCart={() => {
            onAddToCart(product);
            setAdded(true);
          }}
        />
      )}
    </>
  );
};

export default function SupermarketPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<SupermarketProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const pageSize = 20;

  // Fetch store info for WhatsApp number
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/v1/store-info`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.whatsapp) {
          setPhoneNumber(data.data.whatsapp.replace(/[^0-9]/g, ''));
        }
      })
      .catch((error) => {
        console.error('Failed to fetch store info:', error);
      });
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getAll('Supermarket');
        const r = res as ApiResponse<Category[]>;
        if (r.success && r.data) {
          setCategories(r.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await supermarketApi.getAll(page, pageSize, categoryId, search)) as ApiResponse<PagedResult<SupermarketProduct>>;
      if (res.success && res.data) {
        setProducts(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryId, search]);

  // Fetch product details for modal
  const fetchProductDetail = async (productId: number): Promise<ProductDetail> => {
    const res = await supermarketApi.getById(productId);
    if (res.success && res.data) {
      return res.data as ProductDetail;
    }
    throw new Error('Failed to fetch product details');
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleAddToCart = (product: SupermarketProduct) => {
    const images = product.images as ImageInfo[] | undefined;
    addItem({
      id: product.id,
      type: 'product',
      name: product.name,
      price: product.price,
      unit: product.unit,
      imageUrl: images?.[0]?.url,
      availability: product.availability,
    });
  };

  return (
    <>
      <PageHero
        title="MiniquesCare Supermarket"
        subtitle="Quality groceries, household essentials, books, and more — right next to your pharmacy."
        image="https://res.cloudinary.com/danksdxj8/image/upload/v1774449575/WhatsApp_Image_2026-03-23_at_06.53.08_oigtgd.jpg"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={(v) => { 
                setSearch(v); 
                setPage(1); 
              }}
              placeholder="Search products, brands..."
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <CategoryPill 
            label="All" 
            active={!categoryId} 
            onClick={() => { 
              setCategoryId(undefined); 
              setPage(1); 
            }} 
          />
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.name}
              active={categoryId === c.id}
              onClick={() => { 
                setCategoryId(c.id); 
                setPage(1); 
              }}
            />
          ))}
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-6">
            {totalCount.toLocaleString()} product{totalCount !== 1 ? 's' : ''} available
          </p>
        )}

        {/* Products Grid */}
        {loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <EmptyState message="No products found. Try a different search or category." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((product) => (
              <EnhancedProductCard
                key={product.id}
                product={product}
                phoneNumber={phoneNumber}
                onProductClick={fetchProductDetail}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination 
            page={page} 
            totalPages={totalPages} 
            onPage={setPage} 
          />
        )}
      </section>
    </>
  );
}
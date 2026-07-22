export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  total: number;      // ✅ FIXED: was totalCount — the actual API returns "total"
  page: number;
  pageSize: number;
}

export interface Drug {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
  description?: string;
  images: ImageInfo[];
  unit: string;
  price: number;
  requiresPrescription: boolean;
  availability: 'Available' | 'OutOfStock' | 'Discontinued';
  createdAt: string;
  updatedAt: string;
}

export interface LabTest {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  description?: string;
  preparation?: string;
  sampleType: string;
  turnaroundTime: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupermarketProduct {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  brand?: string;
  images: ImageInfo[];
  description?: string;
  unit: string;
  price: number;
  availability: 'Available' | 'OutOfStock' | 'Discontinued';
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: number;
  authorId: number;
  authorName?: string;
  title: string;
  summary?: string;
  content: string;
  images: ImageInfo[];
  status: 'Draft' | 'Published' | 'Archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogSummary {
  id: number;
  title: string;
  summary?: string;
  coverImageUrl?: string;
  status: string;
  publishedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  type: 'Drug' | 'Lab' | 'Supermarket';
  typeLabel: string;
}

export interface StoreInfo {
  id: number;
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  openingHours?: string;
  googleMapsUrl?: string;
  googleMapsEmbed?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  about?: string;
  updatedAt: string;
}

export interface ImageInfo {
  url: string;
  publicId: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  admin: Admin;
}

export type CartItemType = 'drug' | 'product';

export interface CartItem {
  id: number; // productId
  cartItemId?: number; // backend cart item id — required for update/remove once synced
  type: CartItemType;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  requiresPrescription?: boolean;
  availability?: string;
}

// Shape returned by GET /api/cart, POST /api/cart/items, PUT/DELETE /api/cart/items/{id}
export interface BackendCartItem {
  id: number; // this IS the cart item id
  productId: number;
  productName: string;
  productType: 'Drug' | 'SupermarketProduct';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

// ✅ FIXED: aligned to the actual TransactionResponseDto / GET /api/Payment/transactions shape
// (was: reference, status, no items — none of which exist on the real payload)
export interface TransactionItem {
  productId: number;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Transaction {
  id: number;
  transactionReference: string;
  customerEmail: string;
  customerPhoneNumber: string;
  amount: number;
  transactionStatus: 'Pending' | 'Confirmed' | 'Failed' | 'Cancelled';
  paymentType: string;
  referenceEntityId: number | null;
  paystackChannel: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  cartId: string | null;
  items: TransactionItem[] | null;
}

export interface BackendCart {
  cartId: string;
  items: BackendCartItem[];
  subtotal: number;
  breakdown?: {
    subtotal: number;
    shipping: number | null;
    discount: number | null;
    total: number;
  };
}

export type OrderType = 'Drug' | 'Supermarket';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Delivered' | 'Cancelled';

export interface UpdateEmailRequest {
  email: string;
  password: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
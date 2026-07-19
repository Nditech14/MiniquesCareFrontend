import { getRefreshToken, getToken, saveTokens } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string,
  retry = true
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token && retry) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            saveTokens(refreshData.data.accessToken, refreshData.data.refreshToken ?? refreshToken);
            return request<T>(path, options, refreshData.data.accessToken, false);
          }
        }
      } catch {
        // fall through to error
      }
    }
  }

  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json();
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') q.set(k, String(v));
  });
  return q.toString() ? `?${q.toString()}` : '';
}

export function getApiBaseUrl() {
  return BASE_URL;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  refresh: (refreshToken: string) =>
    request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  logout: (token: string) =>
    request('/api/v1/auth/logout', { method: 'POST' }, token),
};

// ── Drugs ─────────────────────────────────────────────────────────────────────
export const drugsApi = {
  getAll: (page = 1, pageSize = 20, categoryId?: number, search?: string) =>
    request(`/api/v1/drugs${buildQuery({ page, pageSize, categoryId, search })}`),
  getById: (id: number) => request(`/api/v1/drugs/${id}`),
  create: (data: unknown, token: string) =>
    request('/api/v1/drugs', { method: 'POST', body: JSON.stringify(data) }, token),
  update: (id: number, data: unknown, token: string) =>
    request(`/api/v1/drugs/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  delete: (id: number, token: string) =>
    request(`/api/v1/drugs/${id}`, { method: 'DELETE' }, token),
  uploadImages: (id: number, formData: FormData, token: string) =>
    fetch(`${BASE_URL}/api/v1/drugs/${id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((r) => r.json()),
  deleteImage: (id: number, publicId: string, token: string) =>
    request(
      `/api/v1/drugs/${id}/images/${encodeURIComponent(publicId)}`,
      { method: 'DELETE' },
      token
    ),
};

// ── Lab Tests ─────────────────────────────────────────────────────────────────
export const labApi = {
  getAll: (page = 1, pageSize = 20, categoryId?: number, sampleType?: string, search?: string) =>
    request(`/api/v1/lab-tests${buildQuery({ page, pageSize, categoryId, sampleType, search })}`),
  getById: (id: number) => request(`/api/v1/lab-tests/${id}`),
  create: (data: unknown, token: string) =>
    request('/api/v1/lab-tests', { method: 'POST', body: JSON.stringify(data) }, token),
  update: (id: number, data: unknown, token: string) =>
    request(`/api/v1/lab-tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  delete: (id: number, token: string) =>
    request(`/api/v1/lab-tests/${id}`, { method: 'DELETE' }, token),
};

// ── Supermarket ───────────────────────────────────────────────────────────────
export const supermarketApi = {
  getAll: (page = 1, pageSize = 20, categoryId?: number, search?: string) =>
    request(
      `/api/v1/supermarket/products${buildQuery({ page, pageSize, categoryId, search })}`
    ),
  getById: (id: number) => request(`/api/v1/supermarket/products/${id}`),
  create: (data: unknown, token: string) =>
    request(
      '/api/v1/supermarket/products',
      { method: 'POST', body: JSON.stringify(data) },
      token
    ),
  update: (id: number, data: unknown, token: string) =>
    request(
      `/api/v1/supermarket/products/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      token
    ),
  delete: (id: number, token: string) =>
    request(`/api/v1/supermarket/products/${id}`, { method: 'DELETE' }, token),
  uploadImages: (id: number, formData: FormData, token: string) =>
    fetch(`${BASE_URL}/api/v1/supermarket/products/${id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((r) => r.json()),
  deleteImage: (id: number, publicId: string, token: string) =>
    request(
      `/api/v1/supermarket/products/${id}/images/${encodeURIComponent(publicId)}`,
      { method: 'DELETE' },
      token
    ),
};

// ── Cart / Checkout ───────────────────────────────────────────────────────────
// NOTE: Cart resolution no longer relies on the guest_session cookie. It is
// driven entirely by an explicit `cartId`, obtained once from
// POST /api/cart/init and then sent on every subsequent cart call
// (get/addItem/checkout/preview). This avoids the earlier bug where checkout
// resolved to a different (empty) cart than add-to-cart because of
// cookie/session mismatches across requests.
export interface DeliveryDetails {
  state?: string;
  city?: string;
  address?: string;
  landmark?: string;
  shippingRateId?: number;
}

export interface CheckoutRequest {
  cartId: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  isDelivery: boolean;
  delivery?: DeliveryDetails;
  orderNotes?: string;
}

export interface CreateCartResponse {
  cartId: string;
}

// ── Checkout preview types ────────────────────────────────────────────────────
// Mirrors CartBreakdownDto / CheckoutPreviewResponseDto on the backend.

export interface DiscountBreakdown {
  name: string;
  type: 'FlatRate' | 'Percentage';
  value: number;
  amount: number;
}

export interface ShippingBreakdown {
  shippingRateId: number;
  rateName: string;
  cost: number;
  address: {
    state: string;
    city: string;
    address: string;
    landmark?: string;
  };
}

export interface CartBreakdown {
  subtotal: number;
  shipping?: ShippingBreakdown | null;
  discount?: DiscountBreakdown | null;
  total: number;
}

export interface CheckoutPreviewItem {
  id: number;
  productId: number;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface CheckoutPreviewResponse {
  cartId: string;
  items: CheckoutPreviewItem[];
  breakdown: CartBreakdown;
  expiresInSeconds: number;
}

export interface CheckoutPreviewRequest {
  cartId: string;
  isDelivery: boolean;
  shippingRateId?: number;
}

export const cartApi = {
  init: () =>
    request<{ success: boolean; message?: string; data: CreateCartResponse }>(
      '/api/cart/init',
      { method: 'POST' }
    ),

  get: (cartId: string) => request(`/api/cart${buildQuery({ cartId })}`),

  addItem: (data: {
    cartId: string;
    productId: number;
    productType: string;
    quantity: number;
  }) => request('/api/cart/items', { method: 'POST', body: JSON.stringify(data) }),

  updateItem: (cartItemId: number, quantity: number) =>
    request(`/api/cart/items/${cartItemId}${buildQuery({ quantity })}`, { method: 'PUT' }),

  removeItem: (cartItemId: number) =>
    request(`/api/cart/items/${cartItemId}`, { method: 'DELETE' }),

  // ✅ Snapshot of totals (incl. delivery fee, once selected) shown to the
  // customer before the real charge fires. Backend caches it briefly so the
  // subsequent checkout call reuses the exact same numbers.
  preview: (data: CheckoutPreviewRequest) =>
    request<{ success: boolean; message?: string; data: CheckoutPreviewResponse }>(
      '/api/cart/preview',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  checkout: (data: CheckoutRequest) =>
    request('/api/cart/checkout', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Shipping Rates ────────────────────────────────────────────────────────────
export const shippingApi = {
  getAll: () => request('/api/ShippingRate/all'),
  calculate: (location: string) =>
    request('/api/ShippingRate/calculate', { method: 'POST', body: JSON.stringify({ location }) }),
};

// ── Orders (admin) ────────────────────────────────────────────────────────────
// Kept for the admin dashboard's booking/payment views if you use them there.
// This does NOT back the customer-facing checkout flow — use `cartApi.checkout`.
export const ordersApi = {
  getAll: (page = 1, pageSize = 20, status?: string, email?: string, token?: string) =>
    request(
      `/api/Payment/transactions${buildQuery({ page, pageSize, status, email })}`,
      {},
      token ?? getToken() ?? undefined
    ),
  getByReference: (reference: string, token?: string) =>
    request(`/api/Payment/transaction/${reference}`, {}, token ?? getToken() ?? undefined),
};

// ── Blog ──────────────────────────────────────────────────────────────────────
export const blogsApi = {
  getAll: (page = 1, pageSize = 10, status?: string, token?: string) =>
    request(
      `/api/v1/blogs${buildQuery({ page, pageSize, status })}`,
      {},
      token
    ),
  getById: (id: number) => request(`/api/v1/blogs/${id}`),
  create: (data: unknown, token: string) =>
    request('/api/v1/blogs', { method: 'POST', body: JSON.stringify(data) }, token),
  update: (id: number, data: unknown, token: string) =>
    request(`/api/v1/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  delete: (id: number, token: string) =>
    request(`/api/v1/blogs/${id}`, { method: 'DELETE' }, token),
  publish: (id: number, token: string) =>
    request(`/api/v1/blogs/${id}/publish`, { method: 'PATCH' }, token),
  unpublish: (id: number, token: string) =>
    request(`/api/v1/blogs/${id}/unpublish`, { method: 'PATCH' }, token),
  uploadImages: (id: number, formData: FormData, token: string) =>
    fetch(`${BASE_URL}/api/v1/blogs/${id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((r) => r.json()),
  deleteImage: (id: number, publicId: string, token: string) =>
    request(
      `/api/v1/blogs/${id}/images/${encodeURIComponent(publicId)}`,
      { method: 'DELETE' },
      token
    ),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: (type: 'Drug' | 'Lab' | 'Supermarket') =>
    request(`/api/v1/categories?type=${type}`),
  create: (data: unknown, token: string) =>
    request('/api/v1/categories', { method: 'POST', body: JSON.stringify(data) }, token),
  update: (id: number, data: unknown, token: string) =>
    request(`/api/v1/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  delete: (id: number, token: string) =>
    request(`/api/v1/categories/${id}`, { method: 'DELETE' }, token),
};

// ── Store Info ────────────────────────────────────────────────────────────────
export const storeApi = {
  get: () => request('/api/v1/store-info'),
  upsert: (data: unknown, token: string) =>
    request('/api/v1/store-info', { method: 'PUT', body: JSON.stringify(data) }, token),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getProfile: (token: string) => request('/api/v1/admin/profile', {}, token),
  updateEmail: (data: unknown, token: string) =>
    request('/api/v1/admin/email', { method: 'PUT', body: JSON.stringify(data) }, token),
  updatePassword: (data: unknown, token: string) =>
    request('/api/v1/admin/password', { method: 'PUT', body: JSON.stringify(data) }, token),
  updateProfileImage: (formData: FormData, token: string) =>
    fetch(`${BASE_URL}/api/v1/admin/profile-image`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((r) => r.json()),
};
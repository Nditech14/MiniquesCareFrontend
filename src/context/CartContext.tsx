'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartApi } from '@/lib/api';
import type { BackendCart, BackendCartItem, CartItem, CartItemType } from '@/types';

const META_KEY = 'mc_cart_meta';
const CART_ID_KEY = 'mc_cart_id';

type ItemMeta = { unit: string; requiresPrescription?: boolean; availability?: string };

function loadMeta(): Record<string, ItemMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMeta(meta: Record<string, ItemMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function loadCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_ID_KEY);
}

function saveCartId(id: string) {
  localStorage.setItem(CART_ID_KEY, id);
}

const PRODUCT_TYPE_TO_CART_TYPE: Record<BackendCartItem['productType'], CartItemType> = {
  Drug: 'drug',
  SupermarketProduct: 'product',
};

const CART_TYPE_TO_PRODUCT_TYPE: Record<CartItemType, BackendCartItem['productType']> = {
  drug: 'Drug',
  product: 'SupermarketProduct',
};

function metaKey(type: CartItemType, productId: number) {
  return `${type}-${productId}`;
}

function mapBackendItem(
  backendItem: BackendCartItem,
  meta: Record<string, ItemMeta>
): CartItem {
  const type = PRODUCT_TYPE_TO_CART_TYPE[backendItem.productType];
  const cached = meta[metaKey(type, backendItem.productId)];
  return {
    id: backendItem.productId,
    cartItemId: backendItem.id,
    type,
    name: backendItem.productName,
    price: backendItem.unitPrice,
    unit: cached?.unit ?? '',
    quantity: backendItem.quantity,
    imageUrl: backendItem.imageUrl,
    requiresPrescription: cached?.requiresPrescription,
    availability: cached?.availability,
  };
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  error: string | null;
  cartId: string | null;
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId'>, quantity?: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearType: (type: CartItemType) => Promise<void>;
  clearAllItems: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshUntilEmpty: (maxAttempts?: number, delayMs?: number) => Promise<boolean>;
  forceClearCart: () => Promise<void>;
  getItemsByType: (type: CartItemType) => CartItem[];
  getSubtotal: (type?: CartItemType) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const metaRef = useRef<Record<string, ItemMeta>>({});
  const cartIdRef = useRef<string | null>(null);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    metaRef.current = loadMeta();
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const applyBackendCart = useCallback((cart: BackendCart) => {
    cartIdRef.current = cart.cartId;
    saveCartId(cart.cartId);
    setCartId(cart.cartId);
    setItems(cart.items.map((i) => mapBackendItem(i, metaRef.current)));
  }, []);

  const ensureCartId = useCallback(async (): Promise<string> => {
    if (cartIdRef.current) return cartIdRef.current;

    const stored = loadCartId();
    if (stored) {
      cartIdRef.current = stored;
      setCartId(stored);
      return stored;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await cartApi.init();
    if (!res.success || !res.data?.cartId) {
      throw new Error(res.message || 'Failed to initialize cart');
    }

    cartIdRef.current = res.data.cartId;
    saveCartId(res.data.cartId);
    setCartId(res.data.cartId);
    return res.data.cartId;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = await ensureCartId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await cartApi.get(id);
      if (res.success && res.data) {
        applyBackendCart(res.data as BackendCart);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [applyBackendCart, ensureCartId]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = useCallback(
    async (item: Omit<CartItem, 'quantity' | 'cartItemId'>, quantity = 1) => {
      metaRef.current[metaKey(item.type, item.id)] = {
        unit: item.unit,
        requiresPrescription: item.requiresPrescription,
        availability: item.availability,
      };
      saveMeta(metaRef.current);

      setError(null);
      try {
        const id = await ensureCartId();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await cartApi.addItem({
          cartId: id,
          productId: item.id,
          productType: CART_TYPE_TO_PRODUCT_TYPE[item.type],
          quantity,
        });
        if (!res.success) throw new Error(res.message || 'Failed to add item to cart');
        applyBackendCart(res.data as BackendCart);
      } catch (err) {
        console.error('Failed to add item to cart:', err);
        setError(err instanceof Error ? err.message : 'Failed to add item to cart');
        throw err;
      }
    },
    [applyBackendCart, ensureCartId]
  );

  const removeItem = useCallback(
    async (cartItemId: number) => {
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await cartApi.removeItem(cartItemId);
        if (!res.success) throw new Error(res.message || 'Failed to remove item');
        applyBackendCart(res.data as BackendCart);
      } catch (err) {
        console.error('Failed to remove cart item:', err);
        setError(err instanceof Error ? err.message : 'Failed to remove item');
        throw err;
      }
    },
    [applyBackendCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(cartItemId);
        return;
      }
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await cartApi.updateItem(cartItemId, quantity);
        if (!res.success) throw new Error(res.message || 'Failed to update quantity');
        applyBackendCart(res.data as BackendCart);
      } catch (err) {
        console.error('Failed to update cart item:', err);
        setError(err instanceof Error ? err.message : 'Failed to update quantity');
        throw err;
      }
    },
    [applyBackendCart, removeItem]
  );

  const clearType = useCallback(
    async (type: CartItemType) => {
      const toRemove = items.filter((i) => i.type === type && i.cartItemId != null);
      for (const item of toRemove) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await cartApi.removeItem(item.cartItemId as number);
      }
      await refresh();
    },
    [items, refresh]
  );

  const clearAllItems = useCallback(async () => {
    const toRemove = itemsRef.current.filter((i) => i.cartItemId != null);
    for (const item of toRemove) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await cartApi.removeItem(item.cartItemId as number);
    }
    await refresh();
  }, [refresh]);

  const refreshUntilEmpty = useCallback(
    async (maxAttempts = 5, delayMs = 700): Promise<boolean> => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await refresh();
        if (itemsRef.current.length === 0) return true;
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      return itemsRef.current.length === 0;
    },
    [refresh]
  );

  // ✅ forceClearCart does NOT trust React state/refs or wait on the
  // backend's own payment-triggered clear step at all. It fetches the cart
  // fresh from the server, deletes every item it finds one by one via the
  // same DELETE /api/cart/items/{id} endpoint the trash-can button already
  // uses successfully elsewhere, then refreshes local state. This works
  // regardless of whether/when the backend's automatic post-payment clear
  // actually runs — it's a direct, deterministic cleanup driven entirely
  // from the frontend using an endpoint we know works.
  const forceClearCart = useCallback(async (): Promise<void> => {
    try {
      const id = await ensureCartId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await cartApi.get(id);
      const backendItems: BackendCartItem[] = res?.data?.items ?? [];

      for (const item of backendItems) {
        try {
          await cartApi.removeItem(item.id);
        } catch (err) {
          console.error('Failed to remove item while force-clearing cart:', err);
        }
      }
    } catch (err) {
      console.error('Failed to force-clear cart:', err);
    } finally {
      await refresh();
    }
  }, [ensureCartId, refresh]);

  const getItemsByType = useCallback(
    (type: CartItemType) => items.filter((i) => i.type === type),
    [items]
  );

  const getSubtotal = useCallback(
    (type?: CartItemType) => {
      const filtered = type ? items.filter((i) => i.type === type) : items;
      return filtered.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
    [items]
  );

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      loading,
      error,
      cartId,
      addItem,
      removeItem,
      updateQuantity,
      clearType,
      clearAllItems,
      refresh,
      refreshUntilEmpty,
      forceClearCart,
      getItemsByType,
      getSubtotal,
    }),
    [
      items,
      itemCount,
      loading,
      error,
      cartId,
      addItem,
      removeItem,
      updateQuantity,
      clearType,
      clearAllItems,
      refresh,
      refreshUntilEmpty,
      forceClearCart,
      getItemsByType,
      getSubtotal,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
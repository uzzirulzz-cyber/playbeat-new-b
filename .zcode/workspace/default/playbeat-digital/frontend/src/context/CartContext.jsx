import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_KEY = 'pb_guest_cart';

const loadGuestCart = () => {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'); } catch { return []; }
};
const saveGuestCart = (items) => localStorage.setItem(GUEST_KEY, JSON.stringify(items));

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totals: { subtotal: 0, discount: 0, tax: 0, total: 0 }, currency: 'USD', couponCode: '' });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const { data } = await api.get('/cart');
        setCart(data.data);
      } else {
        const items = loadGuestCart();
        const subtotal = items.reduce((s, i) => s + (i.unitPrice || 0) * i.qty, 0);
        setCart({ items, totals: { subtotal, discount: 0, tax: 0, total: subtotal }, currency: 'USD', couponCode: '' });
      }
    } catch {
      /* keep previous state */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Merge guest cart into server cart once on login.
  useEffect(() => {
    if (user) {
      const guestItems = loadGuestCart();
      if (guestItems.length) {
        api.post('/cart/merge', { items: guestItems }).then(({ data }) => {
          setCart(data.data);
          saveGuestCart([]);
        });
      }
    }
  }, [user]);

  const add = async (productId, qty = 1, variantId = null) => {
    if (user) {
      const { data } = await api.post('/cart/items', { productId, qty, variantId });
      setCart(data.data);
    } else {
      // Lightweight guest add: store minimal info; prices recompute after login merge.
      const items = loadGuestCart();
      const existing = items.find((i) => i.productId === productId && String(i.variantId || '') === String(variantId || ''));
      if (existing) existing.qty += qty;
      else items.push({ productId, variantId, qty, unitPrice: 0, name: '', image: '' });
      saveGuestCart(items);
      await fetchCart();
    }
  };

  const updateQty = async (itemId, qty) => {
    if (user) {
      const { data } = await api.put(`/cart/items/${itemId}`, { qty });
      setCart(data.data);
    } else {
      const items = loadGuestCart();
      const item = items.find((i) => i.productId === itemId || i.id === itemId);
      if (item) item.qty = qty;
      saveGuestCart(items);
      await fetchCart();
    }
  };

  const remove = async (itemId) => {
    if (user) {
      const { data } = await api.delete(`/cart/items/${itemId}`);
      setCart(data.data);
    } else {
      const items = loadGuestCart().filter((i) => i.productId !== itemId && i.id !== itemId);
      saveGuestCart(items);
      await fetchCart();
    }
  };

  const applyCoupon = async (code) => {
    const { data } = await api.post('/cart/apply-coupon', { code });
    setCart(data.data);
  };
  const removeCoupon = async () => {
    const { data } = await api.delete('/cart/coupon');
    setCart(data.data);
  };

  const count = cart.items.reduce((s, i) => s + (i.qty || 1), 0);

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, add, updateQty, remove, applyCoupon, removeCoupon, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

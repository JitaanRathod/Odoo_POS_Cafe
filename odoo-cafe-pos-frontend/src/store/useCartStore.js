import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      set({ items: items.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...items, { productId: product.id, productName: product.name, unitPrice: product.price, taxRate: product.taxRate, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) return get().removeItem(productId);
    set({ items: get().items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i) });
  },

  clearCart: () => set({ items: [] }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  getTax: () => get().items.reduce((sum, i) => sum + (i.unitPrice * i.quantity * (i.taxRate || 0)) / 100, 0),

  getTotal: () => get().getSubtotal() + get().getTax(),
}));
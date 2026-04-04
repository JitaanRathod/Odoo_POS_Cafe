import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  items: [],
  activeTableId: null,

  setActiveTable: (tableId) => set({ activeTableId: tableId }),

  addItem: (product) => {
    const { items } = get();
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            qty: 1,
          },
        ],
      });
    }
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== productId),
    })),

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.id === productId ? { ...i, qty } : i
      ),
    }));
  },

  clearCart: () => set({ items: [], activeTableId: null }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },
}));
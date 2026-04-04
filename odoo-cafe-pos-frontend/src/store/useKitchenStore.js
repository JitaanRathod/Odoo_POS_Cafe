import { create } from "zustand";

export const useKitchenStore = create((set, get) => ({
  orders: [],

  addOrder: (order) => {
    const { orders } = get();
    const exists = orders.find((o) => o.id === order.id);
    if (exists) return;
    set({
      orders: [
        ...orders,
        {
          ...order,
          kitchen_status: order.kitchen_status ?? "PENDING",
          items: (order.items ?? []).map((item) => ({ ...item, done: false })),
        },
      ],
    });
  },

  advanceStage: (orderId, nextStage) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, kitchen_status: nextStage } : o
      ),
    })),

  toggleItemDone: (orderId, itemId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            }
          : o
      ),
    })),

  removeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
    })),

  clearCompleted: () =>
    set((state) => ({
      orders: state.orders.filter((o) => o.kitchen_status !== "DONE"),
    })),

  getByStage: (stage) => get().orders.filter((o) => o.kitchen_status === stage),
}));
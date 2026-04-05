import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderAPI } from "../api/order.api";

export const useOrders = (params = {}) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderAPI.getAll(params),
    staleTime: 1000 * 30, // 30 seconds — orders change frequently
  });
};

export const useOrderByTable = (tableId) => {
  return useQuery({
    queryKey: ["order", "table", tableId],
    queryFn: () => orderAPI.getByTable(tableId),
    enabled: !!tableId,
  });
};

export const useOrderById = (orderId) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderAPI.getById(orderId),
    enabled: !!orderId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => orderAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    },
  });
};

export const useAddOrderItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, items }) => orderAPI.addItems(orderId, items),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }) => orderAPI.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    },
  });
};
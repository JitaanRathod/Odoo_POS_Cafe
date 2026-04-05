import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentAPI } from "../api/payment.api";

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentAPI.getMethods(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => paymentAPI.updateMethod(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
};
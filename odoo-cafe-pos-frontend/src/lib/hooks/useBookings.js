import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingAPI } from "../api/booking.api";

export const useBookings = (params = {}) => {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => bookingAPI.getAll(params),
    staleTime: 1000 * 60,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => bookingAPI.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bookingAPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
};
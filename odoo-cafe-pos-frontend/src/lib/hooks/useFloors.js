import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { floorAPI } from "../api/floor.api";

export const useFloors = () => {
  return useQuery({
    queryKey: ["floors"],
    queryFn: () => floorAPI.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateFloor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => floorAPI.createFloor(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors"] }),
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => floorAPI.createTable(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors"] }),
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => floorAPI.updateTable(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors"] }),
  });
};
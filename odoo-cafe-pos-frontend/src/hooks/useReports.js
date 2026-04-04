import { useQuery } from "@tanstack/react-query";
import { reportAPI } from "../api/report.api";

export const useReports = (params = {}) => {
  return useQuery({
    queryKey: ["reports", params],
    queryFn: () => reportAPI.get(params),
    staleTime: 1000 * 60, // 1 minute
    keepPreviousData: true, // smooth period filter transitions
  });
};
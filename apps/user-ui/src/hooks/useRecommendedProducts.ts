import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import useUser from "./useUser";

const useRecommendedProducts = (limit = 10) => {
  const { user } = useUser();

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["recommended-products", limit],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/recommendation/api/get-recommendations?limit=${limit}`,
      );
      return response.data.products ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  return { products, isLoading, isError };
};

export default useRecommendedProducts;

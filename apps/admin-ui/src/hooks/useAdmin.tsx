import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axiosInstance from "../utils/axiosInstance";

const fetchAdmin = async () => {
  const res = await axiosInstance.get("/api/logged-in-admin");
  return res.data.user;
};

const useAdmin = () => {
  const {
    data: admin,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin"],
    queryFn: fetchAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const history = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      history.push("/");
    }
  }, [admin, isLoading]);

  return { admin, isError, isLoading, refetch };
};

export default useAdmin;

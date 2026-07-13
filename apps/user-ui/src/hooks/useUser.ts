//Path: apps/user-ui/src/hooks/useUser.ts
import {useQuery} from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance"
import { useAuthStore } from "../store/authStore";
import { isProtected } from "../utils/protected";

const fetchUser = async (isLoggedIn:boolean) => {
   const config = isLoggedIn ? isProtected : {};
   const response = await axiosInstance.get("/api/logged-in-user", config);
   return response.data.user ?? null;
};

const useUser = () => {
   const [setLoggedIn, isLoggedIn] = useAuthStore();
   const {
data: user, isPending, isError} = useQuery({
   queryKey: ["user"],
   queryFn: fetchUser(isLoggedIn),
   staleTime: 5 * 60 * 1000, // 5 minutes
   retry: false, // Retry once on failure
   onSuccess: () =>{
      setLoggedIn(true);
   },
   onError: () => {
      setLoggedIn(false);
   },
});
   return { user:user as any, isLoading: isPending, isError  };
};

export default useUser;
   
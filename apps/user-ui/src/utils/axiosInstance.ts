//Path: apps/user-ui/src/utils/axiosInstance.ts
import axios from "axios";
import  {runRedirectToLogin}  from "./redirect";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const handlelogout = () => {
  const publicPaths=["/login", "/signup", "/forgot-password"];
  const currentPath = window.location.pathname;
  if (!publicPaths.includes(currentPath)) {
    runRedirectToLogin();
  }
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const subscribeTokenRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshSuccess = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401= error?.response?.status === 401;
    const isRetry = originalRequest?._retry;
    const isAuthRequired = originalRequest?.requiresAuth===true;

    if(is401 && !isRetry && isAuthRequired) {
      if(isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/refresh-token`,
          {},
          { withCredentials: true },
        );

        isRefreshing = false;
        onRefreshSuccess();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        handlelogout();
        return Promise.reject(refreshError);
      }


    
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
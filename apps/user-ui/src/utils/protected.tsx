//Path: apps/user-ui/src/utils/protected.tsx
import { CustomAxiosRequestConfig } from "./axiosInstance.type";

export const isProtected: CustomAxiosRequestConfig = {
  requiresAuth: true,
};

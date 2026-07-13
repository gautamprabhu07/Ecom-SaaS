import type { AxiosRequestConfig } from "axios";

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  // Add any custom properties you want to include in the request config
  requiresAuth?: boolean; // Example: a flag to indicate if the request requires authentication
  _retry?: boolean; // Example: a flag to indicate if the request has been retried
}
//Path: packages/libs/analytics/client.ts
//what the dashboards need on the browser side: the response types, the React Query hooks that fetch them, and a few
//number-formatting helpers. Used by both seller-ui and admin-ui (they differ only in the base URL they pass in).
//No Tailwind class names live here on purpose: styling stays in each app's own files, where it is always scanned.
"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const RANGES = [7, 30, 90, 180] as const;
export type RangeDays = (typeof RANGES)[number];

export interface Compared {
  value: number;
  previous: number;
  //percent change versus the equally long period before; null when that period was zero
  change: number | null;
}

export interface Summary {
  days: number;
  revenue: Compared;
  orders: Compared;
  visitors: Compared;
  mobileShare: { value: number | null };
}

export interface RevenuePoint {
  label: string;
  start: string;
  revenue: number;
  orders: number;
}

export interface RevenueSeries {
  days: number;
  unit: "day" | "week" | "month";
  points: RevenuePoint[];
  totalRevenue: number;
  totalOrders: number;
}

export interface Devices {
  total: number;
  slices: { name: "Desktop" | "Mobile" | "Tablet" | "Other"; value: number; share: number }[];
}

export interface Geography {
  totalVisits: number;
  countries: { name: string; visits: number }[];
  cities: { name: string; visits: number }[];
}

export interface Funnel {
  views: number;
  cartAdds: number;
  wishlistAdds: number;
  purchases: number;
  conversion: { viewToCart: number | null; cartToPurchase: number | null; viewToPurchase: number | null };
}

export interface TopProduct {
  productId: string;
  title: string;
  category: string;
  price: number;
  image: string | null;
  purchases: number;
  views: number;
  cartAdds: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  reference: string;
  customer: string;
  amount: number;
  paymentStatus: string;
  deliveryStatus: string;
  status: string;
  //which shop the order belongs to (platform-wide view only; null for a seller's own orders)
  shop: string | null;
  createdAt: string;
}

//the only part of axios these hooks use, so any app's axios instance fits
interface Http {
  get: (url: string) => Promise<{ data: any }>;
}

//basePath is "/seller/api/analytics" or "/admin/api/analytics"
export const useDashboardData = (http: Http, basePath: string, days: RangeDays) => {
  const fetchData = async <T>(path: string): Promise<T> => (await http.get(`${basePath}${path}`)).data.data as T;
  const common = {
    staleTime: 60_000,
    //keep showing the previous range's numbers while a new range loads, instead of flashing empty
    placeholderData: keepPreviousData,
  };

  return {
    summary: useQuery({ queryKey: [basePath, "summary", days], queryFn: () => fetchData<Summary>(`/summary?days=${days}`), ...common }),
    revenue: useQuery({ queryKey: [basePath, "revenue", days], queryFn: () => fetchData<RevenueSeries>(`/revenue?days=${days}`), ...common }),
    devices: useQuery({ queryKey: [basePath, "devices"], queryFn: () => fetchData<Devices>("/devices"), staleTime: 60_000 }),
    geography: useQuery({ queryKey: [basePath, "geography"], queryFn: () => fetchData<Geography>("/geography"), staleTime: 60_000 }),
    funnel: useQuery({ queryKey: [basePath, "funnel"], queryFn: () => fetchData<Funnel>("/funnel"), staleTime: 60_000 }),
    topProducts: useQuery({ queryKey: [basePath, "top-products"], queryFn: () => fetchData<TopProduct[]>("/top-products?limit=5"), staleTime: 60_000 }),
    recentOrders: useQuery({ queryKey: [basePath, "recent-orders"], queryFn: () => fetchData<RecentOrder[]>("/recent-orders?limit=6"), staleTime: 30_000 }),
  };
};

// ------------------------------------------------------------------------------------------ formatting
export const formatMoney = (value: number): string =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

export const formatCount = (value: number): string => value.toLocaleString("en-US");

//axis labels like $4k or $12.5k
export const formatMoneyShort = (value: number): string =>
  value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `$${value}`;

//a change like 51.8 becomes "51.8%". Huge swings are capped ("999%+") so a tiny earlier period can't print nonsense.
export const formatChange = (change: number): string => {
  const size = Math.abs(change);
  return size > 999 ? "999%+" : `${size}%`;
};

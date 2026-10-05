//Path: apps/seller-ui/src/app/%28routes%29/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  TrendingUp,
  Smartphone,
  Globe2,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";
import {
  RANGES,
  RangeDays,
  useDashboardData,
  formatChange,
  formatCount,
  formatMoney,
  formatMoneyShort,
} from "packages/libs/analytics/client";
import { COUNTRY_GEO } from "packages/libs/analytics/geo";

const ANALYTICS_BASE = "/seller/api/analytics";

const DEVICE_COLORS: Record<string, string> = {
  Desktop: "#059669",
  Mobile: "#34d399",
  Tablet: "#FDBA74",
  Other: "#A8A29E",
};

//what an order shows in the table: how far delivery has got for a paid order, or its payment state otherwise
const statusStyles: Record<string, string> = {
  Delivered: "bg-[#D1FAE5] text-[#047857] border-[#059669]/20",
  "Out for Delivery": "bg-blue-50 text-blue-700 border-blue-200",
  Shipped: "bg-blue-50 text-blue-700 border-blue-200",
  Packed: "bg-[#FDBA74]/20 text-[#9a5b1f] border-[#FDBA74]/40",
  Ordered: "bg-[#FDBA74]/20 text-[#9a5b1f] border-[#FDBA74]/40",
  Pending: "bg-[#FDBA74]/20 text-[#9a5b1f] border-[#FDBA74]/40",
  Failed: "bg-red-50 text-red-700 border-red-200",
};

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ---------------------------------------------------------------------------

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-[#F5F5F4] ${className}`} />
);

const EmptyState = ({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) => (
  <div className="h-full min-h-[8rem] flex flex-col items-center justify-center gap-2 text-center">
    <div className="w-11 h-11 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center">
      {icon}
    </div>
    <p className="text-sm text-[#78716C] max-w-[16rem]">{message}</p>
  </div>
);

const StatPill = ({
  label,
  value,
  change,
  icon,
  loading,
}: {
  label: string;
  value: string;
  //percent change vs the previous period; null = no earlier period to compare with; undefined = not tracked
  change?: number | null;
  icon: React.ReactNode;
  loading?: boolean;
}) => (
  <div className="group flex items-center gap-3 bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/30 hover:shadow-[0_10px_30px_-6px_rgba(5,150,105,0.18)]">
    <div className="w-9 h-9 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
      {icon}
    </div>
    <div>
      <p className="text-xs text-[#78716C]">{label}</p>
      {loading ? (
        <Skeleton className="h-5 w-20 mt-1" />
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-[#292524]">{value}</span>
          {change === null && (
            <span className="text-[11px] font-medium text-[#78716C]">new</span>
          )}
          {typeof change === "number" && (
            <span
              className={`flex items-center text-[11px] font-medium ${
                change >= 0 ? "text-[#059669]" : "text-red-500"
              }`}
            >
              {change >= 0 ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {formatChange(change)}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
);

const Page = () => {
  const [days, setDays] = useState<RangeDays>(30);
  const { summary, revenue, devices, geography, funnel, topProducts, recentOrders } =
    useDashboardData(axiosInstance, ANALYTICS_BASE, days);

  const revenuePoints = revenue.data?.points ?? [];
  const hasRevenue = revenuePoints.some((p) => p.revenue > 0);

  const deviceData = (devices.data?.slices ?? []).map((s) => ({
    name: s.name,
    value: s.share,
    color: DEVICE_COLORS[s.name],
  }));

  //countries we know how to place on the map
  const mapped = (geography.data?.countries ?? []).filter(
    (c) => COUNTRY_GEO[c.name],
  );
  const highlightedCountryNames = new Set(
    mapped.map((c) => COUNTRY_GEO[c.name].atlas),
  );

  const revenueChange = summary.data?.revenue.change;

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-6 space-y-6 font-['Inter']">
      {/* Header */}
      <div>
        <h1 className="font-['Nunito'] text-xl font-extrabold text-[#292524]">
          Overview
        </h1>
        <p className="text-sm text-[#78716C] mt-0.5">
          A snapshot of how your shop is performing.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          label={`Revenue (${days}d)`}
          value={formatMoney(summary.data?.revenue.value ?? 0)}
          change={summary.data?.revenue.change}
          icon={<TrendingUp size={16} />}
          loading={summary.isPending}
        />
        <StatPill
          label={`Orders (${days}d)`}
          value={formatCount(summary.data?.orders.value ?? 0)}
          change={summary.data?.orders.change}
          icon={<ShoppingBag size={16} />}
          loading={summary.isPending}
        />
        <StatPill
          label={`New visitors (${days}d)`}
          value={formatCount(summary.data?.visitors.value ?? 0)}
          change={summary.data?.visitors.change}
          icon={<Globe2 size={16} />}
          loading={summary.isPending}
        />
        <StatPill
          label="Mobile Share"
          value={
            summary.data?.mobileShare.value == null
              ? "—"
              : `${summary.data.mobileShare.value}%`
          }
          icon={<Smartphone size={16} />}
          loading={summary.isPending}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart — top left */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
                Revenue
              </h2>
              <p className="text-xs text-[#78716C]">Last {days} days</p>
            </div>
            {typeof revenueChange === "number" && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  revenueChange >= 0
                    ? "text-[#059669] bg-[#D1FAE5]"
                    : "text-red-600 bg-red-50"
                }`}
              >
                {revenueChange >= 0 ? "+" : "-"}
                {formatChange(revenueChange)}
              </span>
            )}
          </div>

          {/* Date range */}
          <div
            className="inline-flex rounded-full bg-[#F5F5F4] p-1 gap-1 mb-4"
            role="group"
            aria-label="Date range"
          >
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={days === range}
                onClick={() => setDays(range)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] ${
                  days === range
                    ? "bg-[#059669] text-white shadow-sm"
                    : "text-[#78716C] hover:text-[#292524] hover:bg-white"
                }`}
              >
                {range}d
              </button>
            ))}
          </div>

          <div className="h-64">
            {revenue.isPending ? (
              <Skeleton className="h-full w-full" />
            ) : revenue.isError ? (
              <EmptyState
                icon={<TrendingUp size={18} />}
                message="Couldn't load revenue. Please refresh to try again."
              />
            ) : !hasRevenue ? (
              <EmptyState
                icon={<TrendingUp size={18} />}
                message="No paid orders in this period yet."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenuePoints}
                  margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E7E5E4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatMoneyShort(Number(v))}
                  />
                  <Tooltip
                    formatter={(value: any, _name: any, item: any) => [
                      `${formatMoney(Number(value))} (${item?.payload?.orders ?? 0} orders)`,
                      "Revenue",
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E7E5E4",
                      fontSize: 12,
                      boxShadow: "0 4px 20px -4px rgba(120,53,15,0.15)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Device pie chart — top right */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="mb-4">
            <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
              Devices
            </h2>
            <p className="text-xs text-[#78716C]">Visits by device type</p>
          </div>
          <div className="h-64 flex items-center">
            {devices.isPending ? (
              <Skeleton className="h-full w-full" />
            ) : devices.isError || deviceData.length === 0 ? (
              <EmptyState
                icon={<Smartphone size={18} />}
                message={
                  devices.isError
                    ? "Couldn't load device data."
                    : "No device data yet. It appears once shoppers visit."
                }
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {deviceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E7E5E4",
                      fontSize: 12,
                      boxShadow: "0 4px 20px -4px rgba(120,53,15,0.15)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-[#78716C]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Visitor world map — bottom left */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="mb-4">
            <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
              Visitor Distribution
            </h2>
            <p className="text-xs text-[#78716C]">
              Where your traffic comes from
            </p>
          </div>
          <div className="h-64">
            {geography.isPending ? (
              <Skeleton className="h-full w-full" />
            ) : geography.isError || (geography.data?.countries.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Globe2 size={18} />}
                message={
                  geography.isError
                    ? "Couldn't load visitor locations."
                    : "No visitor locations yet."
                }
              />
            ) : (
              <ComposableMap
                projectionConfig={{ scale: 118 }}
                width={800}
                height={380}
                style={{ width: "100%", height: "100%" }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo) => {
                      const isHighlighted = highlightedCountryNames.has(
                        geo.properties?.name,
                      );
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isHighlighted ? "#D1FAE5" : "#F5F5F4"}
                          stroke="#E7E5E4"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "#6ee7b7" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                {mapped.map((c) => (
                  <Marker key={c.name} coordinates={COUNTRY_GEO[c.name].coordinates}>
                    <circle
                      r={Math.max(3, Math.sqrt(c.visits) / 6)}
                      fill="#059669"
                      fillOpacity={0.75}
                      stroke="#fff"
                      strokeWidth={1}
                    >
                      <title>{`${c.name}: ${formatCount(c.visits)} visits`}</title>
                    </circle>
                  </Marker>
                ))}
              </ComposableMap>
            )}
          </div>
          {(geography.data?.countries.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {geography.data!.countries.slice(0, 5).map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F4] px-2.5 py-1 text-[11px] text-[#78716C] transition-colors duration-150 hover:bg-[#D1FAE5] hover:text-[#047857]"
                >
                  {c.name}
                  <span className="font-semibold text-[#292524]">
                    {formatCount(c.visits)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders — bottom right */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
                Recent Orders
              </h2>
              <p className="text-xs text-[#78716C]">
                Latest activity across your shop
              </p>
            </div>
          </div>
          {recentOrders.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : recentOrders.isError || (recentOrders.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={18} />}
              message={
                recentOrders.isError
                  ? "Couldn't load recent orders."
                  : "No orders yet. They show up here as they come in."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#78716C] border-b border-[#E7E5E4]">
                    <th className="pb-2 font-medium">Order ID</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F4]">
                  {recentOrders.data!.map((order) => (
                    <tr
                      key={order.id}
                      className="text-[#292524] transition-colors duration-150 hover:bg-[#FAF8F3]"
                    >
                      <td className="py-2.5 font-medium text-[#292524]">
                        #{order.reference}
                      </td>
                      <td className="py-2.5 text-[#78716C]">
                        {order.customer}
                        {order.shop && (
                          <span className="block text-[11px] text-[#A8A29E]">
                            {order.shop}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 font-medium">
                        {formatMoney(order.amount)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border transition-transform duration-150 hover:scale-105 ${
                            statusStyles[order.status] ??
                            "bg-[#F5F5F4] text-[#78716C] border-[#E7E5E4]"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Conversion funnel — third row, left */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="mb-4">
            <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
              Conversion Funnel
            </h2>
            <p className="text-xs text-[#78716C]">
              From product view to purchase, all time
            </p>
          </div>
          {funnel.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : funnel.isError || (funnel.data?.views ?? 0) === 0 ? (
            <EmptyState
              icon={<TrendingUp size={18} />}
              message={
                funnel.isError
                  ? "Couldn't load the funnel."
                  : "No shopper activity recorded yet."
              }
            />
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "Product views",
                  value: funnel.data!.views,
                  note: null as string | null,
                  color: "#A7F3D0",
                },
                {
                  label: "Added to cart",
                  value: funnel.data!.cartAdds,
                  note:
                    funnel.data!.conversion.viewToCart === null
                      ? null
                      : `${funnel.data!.conversion.viewToCart}% of views`,
                  color: "#34d399",
                },
                {
                  label: "Added to wishlist",
                  value: funnel.data!.wishlistAdds,
                  note: null,
                  color: "#FDBA74",
                },
                {
                  label: "Purchased (units)",
                  value: funnel.data!.purchases,
                  note:
                    funnel.data!.conversion.cartToPurchase === null
                      ? null
                      : `${funnel.data!.conversion.cartToPurchase}% of cart adds`,
                  color: "#059669",
                },
              ].map((stage) => (
                <div key={stage.label} className="group">
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-[#78716C]">{stage.label}</span>
                    <span className="text-[#292524]">
                      <span className="font-semibold">
                        {formatCount(stage.value)}
                      </span>
                      {stage.note && (
                        <span className="ml-2 text-[#78716C]">{stage.note}</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F5F5F4] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:brightness-95"
                      style={{
                        width: `${Math.max(2, Math.min(100, (stage.value / funnel.data!.views) * 100))}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              {funnel.data!.conversion.viewToPurchase !== null && (
                <p className="pt-1 text-xs text-[#78716C]">
                  Overall,{" "}
                  <span className="font-semibold text-[#059669]">
                    {funnel.data!.conversion.viewToPurchase}%
                  </span>{" "}
                  of product views end in a purchase.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Top products — third row, right */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="mb-4">
            <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
              Top Products
            </h2>
            <p className="text-xs text-[#78716C]">Best sellers by units sold</p>
          </div>
          {topProducts.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topProducts.isError || (topProducts.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Package size={18} />}
              message={
                topProducts.isError
                  ? "Couldn't load top products."
                  : "No sales yet. Your best sellers will appear here."
              }
            />
          ) : (
            <ul className="space-y-1">
              {topProducts.data!.map((product, index) => (
                <li
                  key={product.productId}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-[#FAF8F3]"
                >
                  <span className="w-5 text-center text-xs font-semibold text-[#A8A29E]">
                    {index + 1}
                  </span>
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-10 h-10 rounded-xl object-cover border border-[#E7E5E4] shrink-0 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#292524]">
                      {product.title}
                    </p>
                    <p className="text-xs text-[#78716C]">
                      {formatCount(product.purchases)} sold
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#059669]">
                    {formatMoney(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;

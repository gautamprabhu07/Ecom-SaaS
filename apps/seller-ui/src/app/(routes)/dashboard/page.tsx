//Path: apps/seller-ui/src/app/%28routes%29/dashboard/page.tsx
"use client";

import React from "react";
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
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static demo data — swap each of these for a real query once there's
// enough order/session volume to make the charts meaningful.
// ---------------------------------------------------------------------------

const revenueData = [
  { month: "Feb", revenue: 4200 },
  { month: "Mar", revenue: 5100 },
  { month: "Apr", revenue: 4800 },
  { month: "May", revenue: 6300 },
  { month: "Jun", revenue: 7100 },
  { month: "Jul", revenue: 8950 },
];

const deviceData = [
  { name: "Desktop", value: 54, color: "#2563eb" },
  { name: "Mobile", value: 38, color: "#60a5fa" },
  { name: "Tablet", value: 8, color: "#bfdbfe" },
];

const visitorCountries = [
  {
    name: "United States",
    coordinates: [-95, 38] as [number, number],
    visitors: 1280,
  },
  { name: "India", coordinates: [79, 22] as [number, number], visitors: 940 },
  {
    name: "United Kingdom",
    coordinates: [-2, 54] as [number, number],
    visitors: 610,
  },
  { name: "Germany", coordinates: [10, 51] as [number, number], visitors: 430 },
  {
    name: "Brazil",
    coordinates: [-51, -10] as [number, number],
    visitors: 310,
  },
  {
    name: "Australia",
    coordinates: [134, -25] as [number, number],
    visitors: 260,
  },
  { name: "Japan", coordinates: [138, 36] as [number, number], visitors: 190 },
];

const highlightedCountryNames = new Set(visitorCountries.map((c) => c.name));

type OrderStatus = "Delivered" | "Shipped" | "Processing" | "Cancelled";

const recentOrders: {
  id: string;
  customer: string;
  amount: number;
  status: OrderStatus;
}[] = [
  {
    id: "ORD-8841",
    customer: "Elena Marsh",
    amount: 128.5,
    status: "Delivered",
  },
  { id: "ORD-8840", customer: "Rui Tanaka", amount: 64.0, status: "Shipped" },
  {
    id: "ORD-8839",
    customer: "Priya Nair",
    amount: 249.99,
    status: "Processing",
  },
  {
    id: "ORD-8838",
    customer: "Marcus Cole",
    amount: 39.0,
    status: "Delivered",
  },
  {
    id: "ORD-8837",
    customer: "Sofia Reyes",
    amount: 88.25,
    status: "Cancelled",
  },
  { id: "ORD-8836", customer: "David Kim", amount: 175.0, status: "Shipped" },
];

const statusStyles: Record<OrderStatus, string> = {
  Delivered: "bg-green-50 text-green-700 border-green-200",
  Shipped: "bg-blue-50 text-blue-700 border-blue-200",
  Processing: "bg-amber-50 text-amber-700 border-amber-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ---------------------------------------------------------------------------

const StatPill = ({
  label,
  value,
  delta,
  positive,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-gray-800">{value}</span>
        <span
          className={`flex items-center text-[11px] font-medium ${
            positive ? "text-green-600" : "text-red-500"
          }`}
        >
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </span>
      </div>
    </div>
  </div>
);

const Page = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          A snapshot of how your shop is performing.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          label="Revenue (30d)"
          value="$8,950"
          delta="12.4%"
          positive
          icon={<TrendingUp size={16} />}
        />
        <StatPill
          label="Orders (30d)"
          value="312"
          delta="4.1%"
          positive
          icon={<ShoppingBag size={16} />}
        />
        <StatPill
          label="Visitors (30d)"
          value="4,020"
          delta="2.3%"
          positive={false}
          icon={<Globe2 size={16} />}
        />
        <StatPill
          label="Mobile Share"
          value="38%"
          delta="1.8%"
          positive
          icon={<Smartphone size={16} />}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart — top left */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Revenue</h2>
              <p className="text-xs text-gray-400">Last 6 months</p>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +26.4%
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device pie chart — top right */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Devices</h2>
            <p className="text-xs text-gray-400">Sessions by device type</p>
          </div>
          <div className="h-64 flex items-center">
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
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visitor world map — bottom left */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Visitor Distribution
            </h2>
            <p className="text-xs text-gray-400">
              Where your traffic comes from
            </p>
          </div>
          <div className="h-64">
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
                        fill={isHighlighted ? "#bfdbfe" : "#f1f5f9"}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "#93c5fd" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
              {visitorCountries.map((c) => (
                <Marker key={c.name} coordinates={c.coordinates}>
                  <circle
                    r={Math.max(3, Math.sqrt(c.visitors) / 8)}
                    fill="#2563eb"
                    fillOpacity={0.75}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                </Marker>
              ))}
            </ComposableMap>
          </div>
        </div>

        {/* Recent orders — bottom right */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Recent Orders
              </h2>
              <p className="text-xs text-gray-400">
                Latest activity across your shop
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Order ID</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="text-gray-700">
                    <td className="py-2.5 font-medium text-gray-800">
                      {order.id}
                    </td>
                    <td className="py-2.5">{order.customer}</td>
                    <td className="py-2.5">${order.amount.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

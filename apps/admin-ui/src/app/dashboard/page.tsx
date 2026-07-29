//Path: apps/admin-ui/src/app/dashboard/page.tsx
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
  { name: "Desktop", value: 54, color: "#059669" },
  { name: "Mobile", value: 38, color: "#34d399" },
  { name: "Tablet", value: 8, color: "#FDBA74" },
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
  Delivered: "bg-[#D1FAE5] text-[#047857] border-[#059669]/20",
  Shipped: "bg-blue-50 text-blue-700 border-blue-200",
  Processing: "bg-[#FDBA74]/20 text-[#9a5b1f] border-[#FDBA74]/40",
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
  <div className="group flex items-center gap-3 bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/30 hover:shadow-[0_10px_30px_-6px_rgba(5,150,105,0.18)]">
    <div className="w-9 h-9 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
      {icon}
    </div>
    <div>
      <p className="text-xs text-[#78716C]">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-[#292524]">{value}</span>
        <span
          className={`flex items-center text-[11px] font-medium ${
            positive ? "text-[#059669]" : "text-red-500"
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
    <div className="min-h-screen bg-[#FAF8F3] p-6 space-y-6 font-['Inter']">
      {/* Header */}
      <div>
        <h1 className="font-['Nunito'] text-xl font-extrabold text-[#292524]">
          Overview
        </h1>
        <p className="text-sm text-[#78716C] mt-0.5">
          A snapshot of how the platform is performing.
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
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
                Revenue
              </h2>
              <p className="text-xs text-[#78716C]">Last 6 months</p>
            </div>
            <span className="text-xs font-medium text-[#059669] bg-[#D1FAE5] px-2 py-1 rounded-full">
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
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#78716C" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#78716C" }}
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
          </div>
        </div>

        {/* Device pie chart — top right */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="mb-4">
            <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
              Devices
            </h2>
            <p className="text-xs text-[#78716C]">Sessions by device type</p>
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
          </div>
        </div>

        {/* Visitor world map — bottom left */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="mb-4">
            <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
              Visitor Distribution
            </h2>
            <p className="text-xs text-[#78716C]">
              Where platform traffic comes from
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
              {visitorCountries.map((c) => (
                <Marker key={c.name} coordinates={c.coordinates}>
                  <circle
                    r={Math.max(3, Math.sqrt(c.visitors) / 8)}
                    fill="#059669"
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
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-['Nunito'] text-sm font-bold text-[#292524]">
                Recent Orders
              </h2>
              <p className="text-xs text-[#78716C]">
                Latest activity across the platform
              </p>
            </div>
          </div>
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
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="text-[#292524] transition-colors duration-150 hover:bg-[#FAF8F3]"
                  >
                    <td className="py-2.5 font-medium text-[#292524]">
                      {order.id}
                    </td>
                    <td className="py-2.5 text-[#78716C]">
                      {order.customer}
                    </td>
                    <td className="py-2.5 font-medium">
                      ${order.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border transition-transform duration-150 hover:scale-105 ${statusStyles[order.status]}`}
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

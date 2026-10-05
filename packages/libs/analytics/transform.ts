//Path: packages/libs/analytics/transform.ts
//pure helpers behind the dashboard analytics: no database access, so they can be unit tested and shared.
//All dates are handled in UTC so a day boundary means the same thing on every server.

export const ALLOWED_RANGES = [7, 30, 90, 180] as const;
export type RangeDays = (typeof ALLOWED_RANGES)[number];
export const DEFAULT_RANGE: RangeDays = 30;

//accepts the ?days= query value; returns null when it isn't one of the supported ranges
export const parseRange = (value: unknown): RangeDays | null => {
  if (value === undefined || value === null || value === "") return DEFAULT_RANGE;
  const days = Number(Array.isArray(value) ? value[0] : value);
  return (ALLOWED_RANGES as readonly number[]).includes(days) ? (days as RangeDays) : null;
};

export type BucketUnit = "day" | "week" | "month";

//short ranges get one point per day, a quarter gets weeks, half a year gets months: enough points to see a trend
//without a cramped axis
export const bucketUnitFor = (days: number): BucketUnit => (days <= 30 ? "day" : days <= 90 ? "week" : "month");

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const startOfUtcDay = (time: number): number => Math.floor(time / DAY_MS) * DAY_MS;

//weeks start on Monday
const startOfUtcWeek = (time: number): number => {
  const day = startOfUtcDay(time);
  const weekday = (new Date(day).getUTCDay() + 6) % 7; //Monday = 0
  return day - weekday * DAY_MS;
};

const startOfUtcMonth = (time: number): number => {
  const d = new Date(time);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
};

const bucketStart = (time: number, unit: BucketUnit): number =>
  unit === "day" ? startOfUtcDay(time) : unit === "week" ? startOfUtcWeek(time) : startOfUtcMonth(time);

const nextBucket = (start: number, unit: BucketUnit): number => {
  if (unit === "day") return start + DAY_MS;
  if (unit === "week") return start + 7 * DAY_MS;
  const d = new Date(start);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
};

const labelFor = (start: number, unit: BucketUnit): string => {
  const d = new Date(start);
  if (unit === "month") return MONTHS[d.getUTCMonth()];
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

export interface DailyRevenueRow {
  //"YYYY-MM-DD" (UTC)
  day: string;
  revenue: number;
  orders: number;
}

export interface RevenuePoint {
  label: string;
  //ISO date of the first day this point covers
  start: string;
  revenue: number;
  orders: number;
}

//turns per-day totals into a continuous series for the chart. Periods with no sales are included as zeros, otherwise
//the axis would silently skip quiet days and make a slow week look like a busy one.
export const buildRevenueSeries = (rows: DailyRevenueRow[], days: number, now: number = Date.now()): RevenuePoint[] => {
  const unit = bucketUnitFor(days);
  const first = bucketStart(startOfUtcDay(now) - (days - 1) * DAY_MS, unit);
  const last = bucketStart(now, unit);

  const totals = new Map<number, { revenue: number; orders: number }>();
  for (let t = first; t <= last; t = nextBucket(t, unit)) totals.set(t, { revenue: 0, orders: 0 });

  for (const row of rows) {
    const time = Date.parse(`${row.day}T00:00:00Z`);
    if (Number.isNaN(time)) continue;
    const bucket = totals.get(bucketStart(time, unit));
    if (!bucket) continue; //outside the window
    bucket.revenue += row.revenue;
    bucket.orders += row.orders;
  }

  return [...totals.entries()].map(([start, total]) => ({
    label: labelFor(start, unit),
    start: new Date(start).toISOString().slice(0, 10),
    revenue: Math.round(total.revenue * 100) / 100,
    orders: total.orders,
  }));
};

//the relative change between two periods, as a percentage. null when the earlier period was zero (a percentage of
//zero is meaningless; the UI shows "new" rather than inventing a number)
export const percentChange = (current: number, previous: number): number | null =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

//a / b as a percentage with one decimal; null when b is zero
export const rate = (part: number, whole: number): number | null =>
  whole === 0 ? null : Math.round((part / whole) * 1000) / 10;

// ------------------------------------------------------------------------------------------ devices
export type DeviceType = "Desktop" | "Mobile" | "Tablet" | "Other";

//the tracking hook stores strings like "Chrome on Windows (desktop)". Older rows have the form
//"Chrome 120.0 on Windows 10 (desktop" with the closing bracket missing, so match on the opening bracket only.
export const classifyDevice = (device: string): DeviceType => {
  const match = /\((mobile|tablet|desktop)/i.exec(device ?? "");
  if (!match) return "Other";
  const kind = match[1].toLowerCase();
  return kind === "mobile" ? "Mobile" : kind === "tablet" ? "Tablet" : "Desktop";
};

//adds up several { key: count } objects (one per shop)
export const mergeCounts = (sources: (Record<string, unknown> | null | undefined)[]): Record<string, number> => {
  const merged: Record<string, number> = {};
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const [key, value] of Object.entries(source)) {
      const count = Number(value);
      if (Number.isFinite(count) && count > 0) merged[key] = (merged[key] || 0) + count;
    }
  }
  return merged;
};

export interface DeviceSlice {
  name: DeviceType;
  value: number;
  //share of all sessions, in percent
  share: number;
}

export const summarizeDevices = (deviceCounts: Record<string, number>): { total: number; slices: DeviceSlice[] } => {
  const byType: Record<DeviceType, number> = { Desktop: 0, Mobile: 0, Tablet: 0, Other: 0 };
  for (const [device, count] of Object.entries(deviceCounts)) byType[classifyDevice(device)] += count;

  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  const slices = (Object.entries(byType) as [DeviceType, number][])
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value, share: Math.round((value / total) * 1000) / 10 }))
    .sort((a, b) => b.value - a.value);
  return { total, slices };
};

// ------------------------------------------------------------------------------------------ geography
export interface CountrySlice {
  name: string;
  //number of visits (every page visit counts, not unique people)
  visits: number;
}

export const rankCounts = (counts: Record<string, number>, limit?: number): CountrySlice[] => {
  const ranked = Object.entries(counts)
    .map(([name, visits]) => ({ name, visits }))
    .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
  return limit ? ranked.slice(0, limit) : ranked;
};

// ------------------------------------------------------------------------------------------ MongoDB extended JSON
//a raw aggregation returns numbers in extended JSON form ({ "$numberDouble": "1.5" }) when they are not plain
export const toNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const inner = value.$numberDouble ?? value.$numberInt ?? value.$numberLong ?? value.$numberDecimal;
    if (inner !== undefined) return Number(inner);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

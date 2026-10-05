//Path: tools/tests/analytics-transform.spec.ts
import {
  parseRange,
  bucketUnitFor,
  buildRevenueSeries,
  percentChange,
  rate,
  classifyDevice,
  mergeCounts,
  summarizeDevices,
  rankCounts,
  toNumber,
} from "../../packages/libs/analytics/transform";

//a fixed "now": Wednesday 2026-10-07 15:30 UTC
const NOW = Date.parse("2026-10-07T15:30:00Z");

describe("parseRange", () => {
  it("accepts the four supported ranges and defaults to 30", () => {
    for (const days of [7, 30, 90, 180]) expect(parseRange(String(days))).toBe(days);
    expect(parseRange(undefined)).toBe(30);
    expect(parseRange("")).toBe(30);
  });

  it("rejects anything else, so a client can't ask for an unbounded scan", () => {
    for (const bad of ["14", "365", "-7", "abc", "7.5", "0"]) expect(parseRange(bad)).toBeNull();
  });
});

describe("bucketUnitFor", () => {
  it("uses days up to a month, weeks for a quarter and months beyond", () => {
    expect([7, 30, 90, 180].map(bucketUnitFor)).toEqual(["day", "day", "week", "month"]);
  });
});

describe("buildRevenueSeries", () => {
  it("returns one point per day, with zeros for days with no sales", () => {
    const series = buildRevenueSeries([{ day: "2026-10-05", revenue: 120.5, orders: 2 }, { day: "2026-10-07", revenue: 30, orders: 1 }], 7, NOW);
    expect(series).toHaveLength(7);
    expect(series.map((p) => p.start)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"]);
    expect(series.map((p) => p.revenue)).toEqual([0, 0, 0, 0, 120.5, 0, 30]);
    expect(series.map((p) => p.orders)).toEqual([0, 0, 0, 0, 2, 0, 1]);
    expect(series[0].label).toBe("Oct 1");
  });

  it("a 30-day range covers today plus the 29 days before it", () => {
    const series = buildRevenueSeries([], 30, NOW);
    expect(series).toHaveLength(30);
    expect(series[0].start).toBe("2026-09-08");
    expect(series[29].start).toBe("2026-10-07");
  });

  it("rolls days up into Monday-start weeks for a 90-day range", () => {
    //2026-10-05 is a Monday. Sales on Mon 10-05 and Wed 10-07 land in the same week; Sun 10-04 is the previous week.
    const series = buildRevenueSeries(
      [{ day: "2026-10-04", revenue: 10, orders: 1 }, { day: "2026-10-05", revenue: 20, orders: 1 }, { day: "2026-10-07", revenue: 5, orders: 2 }],
      90,
      NOW,
    );
    const lastTwo = series.slice(-2);
    expect(lastTwo.map((p) => p.start)).toEqual(["2026-09-28", "2026-10-05"]);
    expect(lastTwo.map((p) => p.revenue)).toEqual([10, 25]);
    expect(lastTwo.map((p) => p.orders)).toEqual([1, 3]);
    expect(series.every((p) => new Date(p.start).getUTCDay() === 1)).toBe(true); //every bucket starts on a Monday
  });

  it("rolls up into calendar months for a 180-day range, labelled by month name", () => {
    const series = buildRevenueSeries([{ day: "2026-10-02", revenue: 100, orders: 1 }, { day: "2026-09-15", revenue: 50, orders: 1 }, { day: "2026-09-30", revenue: 25, orders: 2 }], 180, NOW);
    const last = series.slice(-2);
    expect(last.map((p) => p.label)).toEqual(["Sep", "Oct"]);
    expect(last.map((p) => p.revenue)).toEqual([75, 100]);
    expect(last.map((p) => p.orders)).toEqual([3, 1]);
    expect(series[0].label).toBe("Apr"); //180 days back from early October reaches April
  });

  it("ignores rows outside the window and rounds money to cents", () => {
    const series = buildRevenueSeries([{ day: "2020-01-01", revenue: 999, orders: 9 }, { day: "2026-10-07", revenue: 0.1 + 0.2, orders: 1 }], 7, NOW);
    expect(series.reduce((sum, p) => sum + p.revenue, 0)).toBeCloseTo(0.3, 10);
    expect(series[6].revenue).toBe(0.3);
  });
});

describe("percentChange and rate", () => {
  it("computes the change versus the earlier period to one decimal", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(75, 100)).toBe(-25);
    expect(percentChange(112.4, 100)).toBe(12.4);
  });

  it("returns null instead of a made-up number when the earlier period was zero", () => {
    expect(percentChange(50, 0)).toBeNull();
    expect(rate(5, 0)).toBeNull();
  });

  it("rate is part / whole as a percentage", () => {
    expect(rate(1, 4)).toBe(25);
    expect(rate(2, 3)).toBe(66.7);
  });
});

describe("classifyDevice", () => {
  it.each([
    ["Chrome on Windows (desktop)", "Desktop"],
    ["Safari on iOS (mobile)", "Mobile"],
    ["Safari on iPadOS (tablet)", "Tablet"],
    //rows written by the old tracking hook: version numbers and the closing bracket missing
    ["Chrome 120.0.6099.109 on Windows 10 (desktop", "Desktop"],
    ["Mobile Safari 17.2 on iOS 17.2 (mobile", "Mobile"],
    ["Unknown Device", "Other"],
    ["", "Other"],
  ])("%s -> %s", (device, expected) => {
    expect(classifyDevice(device)).toBe(expected);
  });
});

describe("mergeCounts, summarizeDevices and rankCounts", () => {
  it("adds the per-shop counters together and ignores junk values", () => {
    const merged = mergeCounts([{ India: 5, Germany: 2 }, { India: 3, Canada: 1 }, null, undefined, { Bad: "x", Zero: 0, Neg: -2 }]);
    expect(merged).toEqual({ India: 8, Germany: 2, Canada: 1 });
  });

  it("groups devices into types with percentage shares, largest first", () => {
    const { total, slices } = summarizeDevices({
      "Chrome on Windows (desktop)": 30,
      "Edge on Windows (desktop)": 10,
      "Safari on iOS (mobile)": 40,
      "Chrome on Android (mobile)": 10,
      "Weird thing": 10,
    });
    expect(total).toBe(100);
    expect(slices).toEqual([
      { name: "Mobile", value: 50, share: 50 },
      { name: "Desktop", value: 40, share: 40 },
      { name: "Other", value: 10, share: 10 },
    ]);
  });

  it("is empty for no data", () => {
    expect(summarizeDevices({})).toEqual({ total: 0, slices: [] });
  });

  it("ranks by count, breaking ties alphabetically, with an optional limit", () => {
    const ranked = rankCounts({ Spain: 5, India: 9, France: 5 });
    expect(ranked).toEqual([{ name: "India", visits: 9 }, { name: "France", visits: 5 }, { name: "Spain", visits: 5 }]);
    expect(rankCounts({ A: 1, B: 2, C: 3 }, 2).map((c) => c.name)).toEqual(["C", "B"]);
  });
});

describe("toNumber", () => {
  it("reads plain numbers and MongoDB extended JSON numbers", () => {
    expect(toNumber(12.5)).toBe(12.5);
    expect(toNumber({ $numberDouble: "7.25" })).toBe(7.25);
    expect(toNumber({ $numberInt: "3" })).toBe(3);
    expect(toNumber({ $numberLong: "9000000000" })).toBe(9_000_000_000);
    expect(toNumber(undefined)).toBe(0);
  });
});

//Path: tools/tests/categories.spec.ts
import { CATEGORY_TREE, CATEGORIES, normalizeCategory, normalizeSubCategory } from "../../packages/types/categories";

describe("CATEGORY_TREE", () => {
  it("defines exactly the 10 agreed categories", () => {
    expect(CATEGORIES).toEqual([
      "Electronics",
      "Fashion",
      "Home & Garden",
      "Health & Beauty",
      "Sports & Outdoors",
      "Toys & Games",
      "Groceries",
      "Books & Stationery",
      "Pet Supplies",
      "Gaming",
    ]);
  });

  it("gives every category at least one subcategory", () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_TREE[category].length).toBeGreaterThan(0);
    }
  });
});

describe("normalizeCategory", () => {
  it.each([
    ["Home", "Home & Garden"],
    ["Sports", "Sports & Outdoors"],
    ["Beauty", "Health & Beauty"],
    ["Grocery", "Groceries"],
    ["Books", "Books & Stationery"],
    ["Stationery", "Books & Stationery"],
    ["Pets", "Pet Supplies"],
    ["bags", "Fashion"],
  ])("maps legacy value %s to %s", (legacy, expected) => {
    expect(normalizeCategory(legacy)).toBe(expected);
  });

  it("passes canonical values through, ignoring case and whitespace", () => {
    expect(normalizeCategory("Electronics")).toBe("Electronics");
    expect(normalizeCategory("  gaming ")).toBe("Gaming");
    expect(normalizeCategory("HOME & GARDEN")).toBe("Home & Garden");
  });

  it("returns null for unknown or empty values", () => {
    expect(normalizeCategory("Furniture Polish")).toBeNull();
    expect(normalizeCategory("")).toBeNull();
  });
});

describe("normalizeSubCategory", () => {
  it("keeps a valid subcategory, ignoring case", () => {
    expect(normalizeSubCategory("Electronics", "laptops")).toBe("Laptops");
  });

  it("falls back to the category's first subcategory when there is no match", () => {
    expect(normalizeSubCategory("Groceries", "Food")).toBe("Snacks");
    expect(normalizeSubCategory("Gaming", "Consoles")).toBe("Consoles");
  });
});

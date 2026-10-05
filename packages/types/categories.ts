//Path: packages/types/categories.ts
//single source of truth for the product/shop taxonomy: used to seed site_config and by the db migration scripts

export const CATEGORY_TREE: Record<string, string[]> = {
  "Electronics": ["Mobile Phones", "Laptops", "Audio", "Cameras", "Accessories"],
  "Fashion": ["Men's Clothing", "Women's Clothing", "Footwear", "Bags & Accessories"],
  "Home & Garden": ["Furniture", "Kitchenware", "Decor", "Gardening Tools"],
  "Health & Beauty": ["Skincare", "Makeup", "Haircare", "Wellness"],
  "Sports & Outdoors": ["Fitness Equipment", "Outdoor Gear", "Sportswear", "Cycling"],
  "Toys & Games": ["Board Games", "Puzzles", "Action Figures", "Educational Toys"],
  "Groceries": ["Snacks", "Beverages", "Pantry", "Organic"],
  "Books & Stationery": ["Fiction", "Non-Fiction", "Study Supplies", "Office Supplies"],
  "Pet Supplies": ["Dog", "Cat", "Grooming", "Pet Toys"],
  "Gaming": ["Consoles", "Games", "Controllers", "PC Gaming"],
};

export const CATEGORIES: string[] = Object.keys(CATEGORY_TREE);

//values that earlier versions of the app stored, keyed by lowercase
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "home": "Home & Garden",
  "sports": "Sports & Outdoors",
  "beauty": "Health & Beauty",
  "grocery": "Groceries",
  "books": "Books & Stationery",
  "stationery": "Books & Stationery",
  "pets": "Pet Supplies",
  "bags": "Fashion",
};

//maps any current or legacy category string onto a canonical one; null when it can't be mapped
export const normalizeCategory = (input: string): string | null => {
  const key = (input ?? "").trim().toLowerCase();
  if (!key) return null;

  const canonical = CATEGORIES.find((category) => category.toLowerCase() === key);
  if (canonical) return canonical;

  return LEGACY_CATEGORY_MAP[key] ?? null;
};

//returns the matching canonical subcategory under `category`, or that category's first one when there is no match
export const normalizeSubCategory = (category: string, input: string): string => {
  const subCategories = CATEGORY_TREE[category];
  if (!subCategories) return input;

  const key = (input ?? "").trim().toLowerCase();
  return subCategories.find((sub) => sub.toLowerCase() === key) ?? subCategories[0];
};

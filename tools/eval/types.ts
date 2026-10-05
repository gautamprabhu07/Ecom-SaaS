//Path: tools/eval/types.ts
//plain shapes shared by the evaluation modules (structurally compatible with the recommender's own types)

export interface EvalAction {
  productId?: string;
  shopId?: string;
  action: string;
  timestamp: string | number;
}

export interface CatalogProduct {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  tags: string[];
  totalSales: number;
  rating: number;
}

//everything a recommender may use to rank products for one buyer
export interface RecommendationContext {
  userId: string;
  //the buyer's history BEFORE the train/test split (never includes held-out behaviour)
  training: EvalAction[];
  //products that may be recommended (see split.ts for how this set is built)
  candidates: CatalogProduct[];
  //the products the training actions refer to (their category and tags describe the buyer's taste)
  interactedProducts: CatalogProduct[];
  //epoch ms of the split: the moment the recommendation is "made"
  now: number;
}

//ranks the candidates, best first, and returns their product ids
export type Recommender = (context: RecommendationContext) => Promise<string[]>;

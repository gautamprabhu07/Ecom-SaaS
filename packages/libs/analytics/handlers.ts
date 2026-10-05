//Path: packages/libs/analytics/handlers.ts
//Express handlers for the analytics endpoints. Both services build theirs from here with a different way of choosing
//the scope: admin-service passes "everything", seller-service passes "this seller's own shop".
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, ValidationError } from "../../error-handler";
import { ALLOWED_RANGES, parseRange } from "./transform";
import { Scope, getDeviceBreakdown, getFunnel, getGeography, getRecentOrders, getRevenueSeries, getSummary, getTopProducts } from "./queries";

type ScopeResolver = (req: Request) => Scope;

const parseLimit = (value: unknown, fallback: number): number => {
  if (value === undefined || value === "") return fallback;
  const limit = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new ValidationError("limit must be a whole number from 1 to 50.");
  return limit;
};

const rangeOrThrow = (req: Request) => {
  const days = parseRange(req.query.days);
  if (days === null) throw new ValidationError(`days must be one of ${ALLOWED_RANGES.join(", ")}.`);
  return days;
};

export const createAnalyticsHandlers = (resolveScope: ScopeResolver) => {
  //wraps a query so every endpoint resolves the scope first, validates input, and forwards errors to the error middleware
  const handle =
    (run: (scope: Scope, req: Request) => Promise<unknown>) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const scope = resolveScope(req);
        res.status(200).json({ data: await run(scope, req) });
      } catch (error) {
        next(error);
      }
    };

  return {
    summary: handle((scope, req) => getSummary(scope, rangeOrThrow(req))),
    revenue: handle((scope, req) => getRevenueSeries(scope, rangeOrThrow(req))),
    devices: handle((scope) => getDeviceBreakdown(scope)),
    geography: handle((scope) => getGeography(scope)),
    funnel: handle((scope) => getFunnel(scope)),
    topProducts: handle((scope, req) => getTopProducts(scope, parseLimit(req.query.limit, 10))),
    recentOrders: handle((scope, req) => getRecentOrders(scope, parseLimit(req.query.limit, 6))),
  };
};

//platform-wide: for admin-service only
export const platformScope: ScopeResolver = () => ({});

//one shop: always the authenticated seller's own, never anything taken from the request. A seller with no shop yet
//must not fall through to an empty scope, which would mean "the whole platform".
export const ownShopScope: ScopeResolver = (req) => {
  const shopId = (req as any).seller?.shop?.id;
  if (!shopId) throw new ForbiddenError("Create your shop first to see analytics.");
  return { shopId };
};

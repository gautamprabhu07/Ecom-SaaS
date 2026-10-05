//Path: tools/db/raw.ts
//shared helpers for the db maintenance scripts. Shops are read through raw Mongo commands because
//Prisma's required `sellers` relation throws on any shop whose sellerId doesn't resolve to a seller.
import "dotenv/config";
import prisma from "../../packages/libs/prisma";

export { prisma };

//Mongo extended JSON wraps ObjectIds as { $oid: "..." }
export const oidOf = (value: any): string | null => value?.$oid ?? (typeof value === "string" ? value : null);
export const idOf = (doc: any): string => oidOf(doc._id) as string;
export const toOid = (id: string) => ({ $oid: id });

const cursorIsOpen = (id: any) => String(id?.$numberLong ?? id) !== "0";

//reads every document in a collection, following the cursor
export async function findAll(collection: string, filter: object = {}, projection: object = {}): Promise<any[]> {
  const first: any = await prisma.$runCommandRaw({ find: collection, filter, projection, batchSize: 5000 });
  const docs: any[] = [...first.cursor.firstBatch];
  let cursorId = first.cursor.id;

  while (cursorIsOpen(cursorId)) {
    const next: any = await prisma.$runCommandRaw({ getMore: cursorId, collection, batchSize: 5000 });
    docs.push(...next.cursor.nextBatch);
    cursorId = next.cursor.id;
  }
  return docs;
}

//ids of every seller that really exists
export async function realSellerIds(): Promise<Set<string>> {
  const sellers = await prisma.sellers.findMany({ select: { id: true } });
  return new Set(sellers.map((seller) => seller.id));
}

export const printTable = (title: string, counts: Record<string, number>) => {
  console.log(`\n${title}`);
  const rows = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  const width = Math.max(8, ...rows.map(([key]) => key.length));
  for (const [key, count] of rows) console.log(`  ${key.padEnd(width)}  ${count}`);
};

export const tally = (values: string[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return counts;
};

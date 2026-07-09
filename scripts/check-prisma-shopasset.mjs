import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
console.log({
  hasShopAsset: typeof p.shopAsset?.findMany === "function",
  hasReviewMedia: typeof p.reviewMedia?.findMany === "function",
});
const count = await p.shopAsset.count();
console.log({ shopAssetCount: count });
await p.$disconnect();

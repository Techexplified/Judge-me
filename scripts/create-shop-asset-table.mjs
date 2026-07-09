import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS "ShopAsset" (
    "id" TEXT PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filename" TEXT,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
  );
`);

await client.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS "ShopAsset_shop_key_key"
  ON "ShopAsset"("shop", "key");
`);

await client.query(`
  CREATE INDEX IF NOT EXISTS "ShopAsset_shop_idx"
  ON "ShopAsset"("shop");
`);

const check = await client.query(`
  SELECT to_regclass('"ShopAsset"') AS table_name;
`);
console.log("ShopAsset table:", check.rows[0]);
await client.end();

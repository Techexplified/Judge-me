import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

const shops = [
  "fqvcpr-ks.myshopify.com",
  "jicm0a-p0.myshopify.com",
  "qnxhhb-0d.myshopify.com",
];

for (const shop of shops) {
  const r = await client.query(`SELECT config FROM "Settings" WHERE shop = $1`, [shop]);
  if (!r.rows[0]) continue;
  const raw = r.rows[0].config;
  const cfg = JSON.parse(raw);
  const sizes = Object.keys(cfg)
    .map((key) => {
      const s = JSON.stringify(cfg[key] ?? null);
      return { key, bytes: Buffer.byteLength(s) };
    })
    .sort((a, b) => b.bytes - a.bytes);

  console.log(`\n=== ${shop} total=${Buffer.byteLength(raw)} ===`);
  console.table(sizes.slice(0, 12));

  const dataUrlMatches = raw.match(/data:[a-zA-Z0-9/+;=.,_-]{20,}/g) || [];
  console.log(
    "embedded data: URLs",
    dataUrlMatches.length,
    "largest",
    dataUrlMatches
      .map((d) => d.length)
      .sort((a, b) => b - a)
      .slice(0, 5),
  );
}

await client.end();

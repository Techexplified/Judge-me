import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

console.log("=== ReviewMedia blobs ===");
console.table(
  (
    await client.query(`
    SELECT COUNT(*)::int AS files,
           pg_size_pretty(COALESCE(SUM(octet_length(data)),0)::bigint) AS blob_bytes,
           pg_size_pretty(COALESCE(AVG(octet_length(data)),0)::bigint) AS avg_file,
           pg_size_pretty(COALESCE(MAX(octet_length(data)),0)::bigint) AS max_file,
           SUM(CASE WHEN type='video' THEN 1 ELSE 0 END)::int AS videos,
           SUM(CASE WHEN type='image' THEN 1 ELSE 0 END)::int AS images
    FROM "ReviewMedia"
  `)
  ).rows,
);

console.log("=== Settings JSON size (main Neon transfer suspect) ===");
console.table(
  (
    await client.query(`
    SELECT COUNT(*)::int AS shops,
           pg_size_pretty(COALESCE(SUM(octet_length(config)),0)::bigint) AS config_bytes,
           pg_size_pretty(COALESCE(AVG(octet_length(config)),0)::bigint) AS avg_config,
           pg_size_pretty(COALESCE(MAX(octet_length(config)),0)::bigint) AS max_config
    FROM "Settings"
  `)
  ).rows,
);

console.log("=== Top 10 largest Settings rows ===");
console.table(
  (
    await client.query(`
    SELECT shop,
           pg_size_pretty(octet_length(config)::bigint) AS config_size,
           octet_length(config) AS bytes
    FROM "Settings"
    ORDER BY octet_length(config) DESC
    LIMIT 10
  `)
  ).rows,
);

console.log("=== App queries by shared_blks_read (approx disk/network from storage) ===");
console.table(
  (
    await client.query(`
    SELECT LEFT(query, 100) AS q,
           calls,
           ROUND((total_exec_time/NULLIF(calls,0))::numeric, 2) AS avg_ms,
           rows AS total_rows,
           shared_blks_read,
           ROUND((shared_blks_read * 8192.0 / 1024 / 1024)::numeric, 2) AS approx_mb_read
    FROM pg_stat_statements
    WHERE query ILIKE '%ReviewMedia%'
       OR query ILIKE '%"Settings"%'
       OR query ILIKE '%ProductIndex%'
       OR query ILIKE '%"Review"%'
       OR query ILIKE '%"Session"%'
    ORDER BY shared_blks_read DESC NULLS LAST, total_exec_time DESC
    LIMIT 20
  `)
  ).rows,
);

console.log("=== Settings SELECT/UPDATE call volume ===");
console.table(
  (
    await client.query(`
    SELECT LEFT(query, 120) AS q, calls, rows AS total_rows,
           ROUND((total_exec_time)::numeric, 0) AS total_ms
    FROM pg_stat_statements
    WHERE query ILIKE '%"Settings"%'
    ORDER BY calls DESC
    LIMIT 15
  `)
  ).rows,
);

console.log("=== Connection / SSL note ===");
const url = process.env.DATABASE_URL || "";
const direct = process.env.DIRECT_URL || "";
console.log({
  database_url_has_pooler: /pooler|pgbouncer|-pooler\./i.test(url),
  direct_url_set: Boolean(direct),
  database_url_host: (() => {
    try {
      return new URL(url).host;
    } catch {
      return "(unparseable)";
    }
  })(),
});

await client.end();

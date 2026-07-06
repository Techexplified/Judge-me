import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

const ext = await client.query(
  `SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements'`,
);
console.log("=== pg_stat_statements extension ===");
console.log(ext.rows.length ? ext.rows[0] : "NOT INSTALLED — enable in Neon console");

if (ext.rows.length) {
  const queries = [
    {
      label: "1. Most total rows transferred (ORDER BY rows DESC)",
      sql: `
        SELECT LEFT(query, 120) AS query_preview, calls,
               rows AS total_rows,
               ROUND(rows::numeric / NULLIF(calls, 0), 1) AS avg_rows_per_call
        FROM pg_stat_statements
        WHERE calls > 0 AND query NOT LIKE '%pg_stat_statements%'
        ORDER BY rows DESC LIMIT 10`,
    },
    {
      label: "2. Worst avg rows per call — missing LIMIT/pagination (ORDER BY avg_rows_per_call DESC)",
      sql: `
        SELECT LEFT(query, 120) AS query_preview, calls,
               rows AS total_rows,
               ROUND(rows::numeric / NULLIF(calls, 0), 1) AS avg_rows_per_call
        FROM pg_stat_statements
        WHERE calls > 0 AND query NOT LIKE '%pg_stat_statements%'
        ORDER BY (rows::numeric / NULLIF(calls, 0)) DESC LIMIT 10`,
    },
    {
      label: "3. Most frequently called (ORDER BY calls DESC)",
      sql: `
        SELECT LEFT(query, 120) AS query_preview, calls,
               rows AS total_rows,
               ROUND(rows::numeric / NULLIF(calls, 0), 1) AS avg_rows_per_call
        FROM pg_stat_statements
        WHERE calls > 0 AND query NOT LIKE '%pg_stat_statements%'
        ORDER BY calls DESC LIMIT 10`,
    },
  ];

  for (const { label, sql } of queries) {
    console.log(`\n=== ${label} ===`);
    const r = await client.query(sql);
    if (r.rows.length === 0) {
      console.log("(no data yet — compute may have just woken up; run app traffic then retry)");
    } else {
      console.table(r.rows);
    }
  }
}

console.log("\n=== Table sizes (storage) ===");
const sizes = await client.query(`
  SELECT relname AS table,
         pg_size_pretty(pg_total_relation_size(quote_ident(relname)::regclass)) AS total_size,
         n_live_tup AS live_rows
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(quote_ident(relname)::regclass) DESC
  LIMIT 10`);
console.table(sizes.rows);

console.log("\n=== Idle connections (compute wake) ===");
const idle = await client.query(`
  SELECT state, COUNT(*) AS count
  FROM pg_stat_activity
  WHERE datname = current_database()
  GROUP BY state ORDER BY count DESC`);
console.table(idle.rows);

await client.end();

import { PrismaClient } from "@prisma/client";

async function check(label, url) {
  if (!url) {
    console.error(`${label}: missing URL in .env`);
    return false;
  }
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const sessionCount = await prisma.session.count();
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    console.log(`${label}: OK — Session rows: ${sessionCount}`);
    console.log(`  Tables: ${tables.map((t) => t.tablename).join(", ")}`);
    return true;
  } catch (err) {
    const msg = err?.message || String(err);
    console.error(`${label}: FAILED`);
    console.error(`  ${msg.split("\n")[0]}`);
    if (msg.includes("Can't reach database")) {
      console.error("  → Neon is asleep or unreachable. Open the Neon console and run any query to wake it.");
    } else if (msg.includes("does not exist")) {
      console.error("  → Run: npm run db:push");
    }
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

console.log("Neon database check\n");
const pooledOk = await check("DATABASE_URL (pooler)", process.env.DATABASE_URL);
const directOk = await check("DIRECT_URL (direct)", process.env.DIRECT_URL);

if (!pooledOk && !directOk) {
  console.log("\nNeither connection works. Your tables are probably fine — the database is not reachable from this machine right now.");
  console.log("Compare local .env DATABASE_URL with Vercel → Settings → Environment Variables.");
  process.exitCode = 1;
} else if (!pooledOk && directOk) {
  console.log("\nPooler failed but direct works. Session storage will use DIRECT_URL (already configured in db.server.js).");
}

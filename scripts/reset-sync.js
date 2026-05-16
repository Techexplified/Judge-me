import db from "../app/db.server.js";

async function forceSync() {
  console.log("Resetting initialSyncDone flag for all shops...");
  
  const settings = await db.settings.findMany();
  for (const row of settings) {
    const config = JSON.parse(row.config || "{}");
    config.initialSyncDone = false;
    await db.settings.update({
      where: { shop: row.shop },
      data: { config: JSON.stringify(config) }
    });
    console.log(`Flag reset successfully for ${row.shop}`);
  }
}

forceSync()
  .catch(console.error)
  .finally(() => process.exit(0));

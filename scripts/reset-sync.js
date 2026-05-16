import db from "../app/db.server.js";

async function forceSync() {
  console.log("Resetting initialSyncDone flag for blog-lift-v2.myshopify.com...");
  const shop = "blog-lift-v2.myshopify.com";
  
  const settingsRow = await db.settings.findUnique({ where: { shop } });
  if (settingsRow) {
    const config = JSON.parse(settingsRow.config || "{}");
    config.initialSyncDone = false;
    await db.settings.update({
      where: { shop },
      data: { config: JSON.stringify(config) }
    });
    console.log("Flag reset successfully.");
  }
}

forceSync()
  .catch(console.error)
  .finally(() => process.exit(0));

import db from "../db.server.js";
import { normalizeShopDomain } from "../utils/shop.server.js";

const REDACTED_AUTHOR = "Redacted";
const REDACTED_COMMENT = "[Redacted per customer privacy request]";

export async function handleComplianceWebhook({ shop: shopRaw, topic, payload }) {
  const shop = normalizeShopDomain(shopRaw);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      await logCustomerDataRequest(shop, payload);
      break;
    case "CUSTOMERS_REDACT":
      await redactCustomerData(shop, payload);
      break;
    case "SHOP_REDACT":
      await redactShopData(shop);
      break;
    default:
      console.warn(`Unhandled compliance webhook topic: ${topic} for ${shop}`);
  }
}

async function logCustomerDataRequest(shop, payload) {
  const email = payload?.customer?.email?.trim();
  if (!email) {
    console.log(`[compliance] CUSTOMERS_DATA_REQUEST for ${shop} (no customer email)`);
    return;
  }

  const reviewCount = await db.review.count({
    where: { shop, email: { equals: email, mode: "insensitive" } },
  });

  console.log(
    `[compliance] CUSTOMERS_DATA_REQUEST for ${shop}: customer=${email}, reviews=${reviewCount}`,
  );
}

async function redactCustomerData(shop, payload) {
  const email = payload?.customer?.email?.trim();
  if (!email) {
    console.log(`[compliance] CUSTOMERS_REDACT for ${shop} (no customer email)`);
    return;
  }

  const result = await db.review.updateMany({
    where: { shop, email: { equals: email, mode: "insensitive" } },
    data: {
      email: null,
      author: REDACTED_AUTHOR,
      title: null,
      comment: REDACTED_COMMENT,
      originalTitle: null,
      originalComment: null,
    },
  });

  console.log(
    `[compliance] CUSTOMERS_REDACT for ${shop}: customer=${email}, reviewsRedacted=${result.count}`,
  );
}

export async function redactShopData(shop) {
  await db.review.deleteMany({ where: { shop } });
  await db.settings.deleteMany({ where: { shop } });
  await db.featureUsage.deleteMany({ where: { shop } });
  await db.productIndex.deleteMany({ where: { shop } });
  await db.groupStoreLink.deleteMany({ where: { shop } });
  await db.session.deleteMany({ where: { shop } });
  await db.shop.deleteMany({ where: { shop } });

  console.log(`[compliance] SHOP_REDACT completed for ${shop}`);
}

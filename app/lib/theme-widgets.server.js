import db from "../db.server.js";
import {
  CORE_EMBED_HANDLE,
  CUSTOMER_LOVE_PAGE_HANDLE,
  PRODUCT_REVIEWS_BLOCK_HANDLE,
  VIDEO_REVIEWS_SLIDER_HANDLE,
  WIDGET_THEME_TARGETS,
} from "./theme-editor-nav.shared.js";

const BLOCK_HANDLE_BY_WIDGET = {
  "review-showcase": PRODUCT_REVIEWS_BLOCK_HANDLE,
  "video-reviews-slider": VIDEO_REVIEWS_SLIDER_HANDLE,
  "customers-love-page": CUSTOMER_LOVE_PAGE_HANDLE,
};

function extractThemeFileContent(body) {
  if (!body) return "";
  if (typeof body.content === "string") return body.content;
  if (typeof body.contentBase64 === "string") {
    return Buffer.from(body.contentBase64, "base64").toString("utf8");
  }
  return "";
}

function stripJsonComments(text) {
  return String(text || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function parseThemeJson(content) {
  try {
    return JSON.parse(stripJsonComments(content));
  } catch {
    return null;
  }
}

function collectBlockTypes(obj, types = new Set()) {
  if (!obj || typeof obj !== "object") return types;
  if (typeof obj.type === "string") types.add(obj.type);
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") collectBlockTypes(value, types);
  }
  return types;
}

function contentHasBlockHandle(content, handle) {
  const text = String(content || "");
  if (!text) return false;
  return (
    text.includes(`/blocks/${handle}/`) ||
    text.includes(`/blocks/${handle}"`) ||
    text.includes(`/blocks/${handle}'`)
  );
}

function blockHandleInstalled(blockTypes, handlesWithContent, handle) {
  if (contentHasBlockHandle(handlesWithContent, handle)) return true;
  const needle = `/blocks/${handle}/`;
  return [...blockTypes].some((type) => type.includes(needle));
}

async function fetchThemeTemplateFiles(admin, themeId) {
  const blockTypes = new Set();
  const contentByHandle = Object.fromEntries(
    Object.values(BLOCK_HANDLE_BY_WIDGET).map((handle) => [handle, ""]),
  );
  let allContent = "";
  let cursor = null;
  let hasNextPage = true;
  let pageCount = 0;

  while (hasNextPage && pageCount < 20) {
    pageCount += 1;
    const resp = await admin.graphql(
      `#graphql
      query ThemeWidgetTemplateFiles($id: ID!, $after: String) {
        theme(id: $id) {
          files(first: 250, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              filename
              body {
                ... on OnlineStoreThemeFileBodyText {
                  content
                }
                ... on OnlineStoreThemeFileBodyBase64 {
                  contentBase64
                }
              }
            }
          }
        }
      }`,
      { variables: { id: themeId, after: cursor } },
    );
    const json = await resp.json();
    if (json?.errors?.length) {
      console.error("[detectThemeInstalledWidgets] GraphQL errors:", json.errors);
      break;
    }

    const connection = json?.data?.theme?.files;
    const nodes = connection?.nodes || [];

    for (const node of nodes) {
      const filename = String(node?.filename || "");
      const content = extractThemeFileContent(node?.body);
      if (!content) continue;
      allContent += content;

      const parsed = parseThemeJson(content);
      if (parsed) {
        collectBlockTypes(parsed, blockTypes);
        if (filename === "config/settings_data.json") {
          const blocks = parsed?.current?.blocks || {};
          for (const block of Object.values(blocks)) {
            if (block?.type) blockTypes.add(block.type);
          }
        }
      }

      for (const handle of Object.values(BLOCK_HANDLE_BY_WIDGET)) {
        if (contentHasBlockHandle(content, handle)) {
          contentByHandle[handle] += content;
        }
      }
    }

    hasNextPage = Boolean(connection?.pageInfo?.hasNextPage);
    cursor = connection?.pageInfo?.endCursor || null;
    if (!nodes.length) break;
  }

  return { blockTypes, contentByHandle, allContent };
}

/** Returns which theme app blocks are present on the live theme. */
export async function detectThemeInstalledWidgets(admin) {
  const installed = {};
  for (const widgetId of Object.keys(WIDGET_THEME_TARGETS)) {
    installed[widgetId] = false;
  }
  installed.coreEmbed = false;

  try {
    const themeResp = await admin.graphql(`#graphql
      query ThemeWidgetsMain {
        themes(first: 1, roles: [MAIN]) {
          nodes { id }
        }
      }
    `);
    const themeJson = await themeResp.json();
    if (themeJson?.errors?.length) {
      console.error("[detectThemeInstalledWidgets] theme query errors:", themeJson.errors);
      return installed;
    }

    const themeId = themeJson?.data?.themes?.nodes?.[0]?.id;
    if (!themeId) return installed;

    const { blockTypes, contentByHandle, allContent } = await fetchThemeTemplateFiles(admin, themeId);

    for (const [widgetId, handle] of Object.entries(BLOCK_HANDLE_BY_WIDGET)) {
      installed[widgetId] = blockHandleInstalled(
        blockTypes,
        contentByHandle[handle],
        handle,
      );
    }
    installed.coreEmbed = blockHandleInstalled(blockTypes, allContent, CORE_EMBED_HANDLE);
  } catch (err) {
    console.error("[detectThemeInstalledWidgets]", err);
  }

  return installed;
}

export function mergeThemeInstalledState(themeInstalled, widgetSettings) {
  const merged = { ...(themeInstalled || {}) };
  const saved = widgetSettings?.installed || {};
  for (const widgetId of Object.keys(WIDGET_THEME_TARGETS)) {
    if (merged[widgetId]) continue;
    if (saved[widgetId]?.confirmedInTheme) {
      merged[widgetId] = true;
    }
  }
  return merged;
}

export async function persistThemeInstalledConfirmations(shop, themeInstalled) {
  const row = await db.settings.findUnique({ where: { shop } });
  let config = {};
  if (row?.config) {
    try {
      config = JSON.parse(row.config);
    } catch {
      config = {};
    }
  }

  const current = config?.widgets?.installed || {};
  let changed = false;
  const nextInstalled = { ...current };

  for (const [widgetId, isThere] of Object.entries(themeInstalled || {})) {
    if (widgetId === "coreEmbed" || !isThere) continue;
    const prev = nextInstalled[widgetId] || {};
    if (!prev.confirmedInTheme) {
      nextInstalled[widgetId] = {
        ...prev,
        confirmedInTheme: true,
        confirmedAt: new Date().toISOString(),
      };
      changed = true;
    }
  }

  if (!changed) return;

  const next = {
    ...config,
    widgets: {
      ...(config.widgets || {}),
      installed: nextInstalled,
    },
  };

  await db.settings.upsert({
    where: { shop },
    update: { config: JSON.stringify(next) },
    create: { shop, config: JSON.stringify(next) },
  });
}

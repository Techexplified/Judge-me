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

function blockHandleInstalled(blockTypes, handle) {
  const needle = `/blocks/${handle}/`;
  return [...blockTypes].some((type) => type.includes(needle));
}

async function fetchThemeTemplateFiles(admin, themeId) {
  const blockTypes = new Set();
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
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
              }
            }
          }
        }
      }`,
      { variables: { id: themeId, after: cursor } },
    );
    const json = await resp.json();
    const connection = json?.data?.theme?.files;
    const nodes = connection?.nodes || [];

    for (const node of nodes) {
      const filename = String(node?.filename || "");
      if (!filename.startsWith("templates/") && filename !== "config/settings_data.json") {
        continue;
      }
      const content = node?.body?.content;
      if (!content) continue;
      const parsed = parseThemeJson(content);
      if (!parsed) continue;
      collectBlockTypes(parsed, blockTypes);
      if (filename === "config/settings_data.json") {
        const blocks = parsed?.current?.blocks || {};
        for (const block of Object.values(blocks)) {
          if (block?.type) blockTypes.add(block.type);
        }
      }
    }

    hasNextPage = Boolean(connection?.pageInfo?.hasNextPage);
    cursor = connection?.pageInfo?.endCursor || null;
    if (!nodes.length) break;
  }

  return blockTypes;
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
    const themeId = themeJson?.data?.themes?.nodes?.[0]?.id;
    if (!themeId) return installed;

    const blockTypes = await fetchThemeTemplateFiles(admin, themeId);

    for (const [widgetId, handle] of Object.entries(BLOCK_HANDLE_BY_WIDGET)) {
      installed[widgetId] = blockHandleInstalled(blockTypes, handle);
    }
    installed.coreEmbed = blockHandleInstalled(blockTypes, CORE_EMBED_HANDLE);
  } catch (err) {
    console.error("[detectThemeInstalledWidgets]", err);
  }

  return installed;
}

export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || "");
}

export function getQuickSearchShortcutLabel() {
  return isMacPlatform() ? "\u2318 S" : "Ctrl S";
}

export function isQuickSearchShortcut(event) {
  return (event.metaKey || event.ctrlKey) && (event.key === "s" || event.key === "S");
}

export function isTypingTarget(target) {
  if (!target || typeof target !== "object") return false;
  const tag = target.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return Boolean(target.isContentEditable);
}

export const SETTINGS_TABS = [
  { id: "pricing", label: "Pricing", path: "/app/settings" },
  { id: "integration", label: "Integration", path: "/app/settings/integration" },
  { id: "translation", label: "Translation", path: "/app/settings/translation" },
  { id: "customizations", label: "Customizations", path: "/app/settings/customizations" },
  { id: "import", label: "Import", path: "/app/settings/import" },
];

export function getActiveSettingsTab(pathname) {
  if (pathname === "/app/settings" || pathname === "/app/settings/") {
    return "pricing";
  }
  const match = SETTINGS_TABS.find(
    (tab) => tab.id !== "pricing" && pathname.startsWith(tab.path),
  );
  return match?.id ?? "pricing";
}

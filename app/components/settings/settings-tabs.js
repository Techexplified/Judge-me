export const SETTINGS_TABS = [
  { id: "pricing", label: "Pricing", path: "/app/settings" },
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

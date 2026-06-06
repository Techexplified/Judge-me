import { Outlet, useLocation } from "react-router";
import { SettingsShell } from "../components/settings/settings-shell";

export default function SettingsLayout() {
  const location = useLocation();
  const variant = location.pathname.includes("/customizations") ? "fullscreen" : "default";

  return (
    <SettingsShell variant={variant}>
      <Outlet />
    </SettingsShell>
  );
}

import { Outlet } from "react-router";
import { SettingsShell } from "../components/settings/settings-shell";

export default function SettingsLayout() {
  return (
    <SettingsShell variant="default">
      <Outlet />
    </SettingsShell>
  );
}

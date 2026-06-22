import {
  translationSettingsAction,
  translationSettingsLoader,
} from "../lib/translation-settings.server.js";
import { WidgetTranslationPanel } from "../components/widgets/widget-translation-panel.jsx";

export const loader = translationSettingsLoader;
export const action = translationSettingsAction;

export default function WidgetTranslationRoute() {
  return <WidgetTranslationPanel />;
}

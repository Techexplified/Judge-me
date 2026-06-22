/* eslint-disable react/prop-types */
import { ChevronRight, Palette, Settings, Type } from "lucide-react";
import { EDITOR_TOKENS, UI_FONT } from "./editor-tokens.js";

const MENU_ITEMS = [
  { id: "style", label: "Style", icon: Palette },
  { id: "text", label: "Text", icon: Type },
  { id: "preferences", label: "Preferences", icon: Settings },
];

export function EditorRootMenu({ onSelect }) {
  return (
    <div style={{ padding: "20px 16px", fontFamily: UI_FONT }}>
      <h2
        style={{
          margin: "0 0 20px",
          fontSize: 16,
          fontWeight: 700,
          color: EDITOR_TOKENS.text,
        }}
      >
        Review form
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${EDITOR_TOKENS.border}`,
                background: EDITOR_TOKENS.white,
                cursor: "pointer",
                fontFamily: UI_FONT,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#ECFDF5",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} color={EDITOR_TOKENS.themeGreen} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: EDITOR_TOKENS.text }}>{item.label}</span>
              </span>
              <ChevronRight size={16} color={EDITOR_TOKENS.textMuted} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

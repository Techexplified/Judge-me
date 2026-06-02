/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  ImagePlus,
  Star,
  Type,
  LayoutTemplate,
  Film,
  Shield,
  RotateCcw,
  Upload,
} from "lucide-react";
import { normalizeHex } from "../../lib/review-form-config.shared.js";
import { TOKENS, UI_FONT, sectionIcons } from "./customizer-styles.js";

function SectionIcon({ type }) {
  const meta = sectionIcons[type];
  const icons = {
    layout: LayoutGrid,
    brand: ImagePlus,
    stars: Star,
    typography: Type,
    cards: LayoutTemplate,
    media: Film,
    trust: Shield,
  };
  const Icon = icons[type];
  if (!Icon || !meta) return null;
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: meta.bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={15} color={meta.color} strokeWidth={2.2} />
    </span>
  );
}

export function CollapsibleSection({
  title,
  iconType,
  defaultOpen = true,
  children,
  trailing,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        borderBottom: `1px solid ${TOKENS.borderLight}`,
        paddingBottom: open ? 16 : 12,
        marginBottom: 4,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "none",
          background: "transparent",
          padding: "14px 0 10px",
          cursor: "pointer",
          fontFamily: UI_FONT,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {iconType ? <SectionIcon type={iconType} /> : null}
          <span style={{ fontSize: 14, fontWeight: 700, color: TOKENS.text, letterSpacing: "-0.01em" }}>
            {title}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {trailing && !open ? trailing : null}
          {open ? (
            <ChevronDown size={16} color="#94a3b8" />
          ) : (
            <ChevronRight size={16} color="#94a3b8" />
          )}
        </span>
      </button>
      {open ? <div style={{ paddingLeft: iconType ? 38 : 0 }}>{children}</div> : null}
    </div>
  );
}

export function FieldLabel({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: TOKENS.label,
        display: "block",
        marginBottom: 8,
        fontFamily: UI_FONT,
      }}
    >
      {children}
    </span>
  );
}

export function ColorRow({ label, value, onColor, onHex, compact = false }) {
  const [hex, setHex] = useState(value);
  useEffect(() => {
    setHex(value);
  }, [value]);
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#059669";
  return (
    <div style={{ flex: compact ? 1 : undefined, marginBottom: compact ? 0 : 14 }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: compact ? "8px 10px" : "8px 12px",
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 10,
          background: TOKENS.white,
        }}
      >
        <label
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            overflow: "hidden",
            flexShrink: 0,
            cursor: "pointer",
            border: `1px solid ${TOKENS.border}`,
            display: "block",
          }}
        >
          <input
            type="color"
            value={safeColor}
            onChange={(e) => {
              onColor(e.target.value);
              setHex(e.target.value);
            }}
            style={{
              width: 40,
              height: 40,
              margin: -4,
              padding: 0,
              border: "none",
              cursor: "pointer",
            }}
          />
        </label>
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={() => {
            const h = normalizeHex(hex);
            if (h) onHex(h);
            else setHex(value);
          }}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 12,
            fontFamily: UI_FONT,
            fontWeight: 500,
            color: TOKENS.textMuted,
            background: "transparent",
            minWidth: 0,
          }}
        />
      </div>
    </div>
  );
}

export function ColorPairRow({ left, right }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      <ColorRow {...left} compact />
      <ColorRow {...right} compact />
    </div>
  );
}

export function ToggleRow({ label, active, onToggle, accent = TOKENS.green }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        padding: "11px 0",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontFamily: UI_FONT,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: "#334155", textAlign: "left" }}>{label}</span>
      <span
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          backgroundColor: active ? accent : "#e5e7eb",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            backgroundColor: "#fff",
            borderRadius: "50%",
            position: "absolute",
            top: 2,
            left: active ? 22 : 2,
            transition: "left 0.15s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </span>
    </button>
  );
}

export function GeomSlider({ label, min, max, value, display, onChange, accent = TOKENS.green }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: TOKENS.label,
          marginBottom: 10,
          fontFamily: UI_FONT,
        }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color: accent }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: accent, cursor: "pointer", height: 4 }}
      />
    </div>
  );
}

function PresetPreview({ presetId }) {
  const bar = (w, h, color, radius = 2) => (
    <div style={{ width: w, height: h, background: color, borderRadius: radius }} />
  );
  const previews = {
    minimal: (
      <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", padding: "0 4px" }}>
        {bar("100%", 3, "#cbd5e1")}
        {bar("70%", 3, "#e2e8f0")}
        {bar("85%", 3, "#e2e8f0")}
      </div>
    ),
    modern: (
      <div
        style={{
          width: "100%",
          padding: "4px 4px",
          border: "1.5px solid #059669",
          borderRadius: 4,
        }}
      >
        <div style={{ height: 3, background: "#059669", borderRadius: 2, marginBottom: 3, width: "40%" }} />
        <div style={{ height: 2, background: "#d1fae5", borderRadius: 2, marginBottom: 2 }} />
        <div style={{ height: 2, background: "#ecfdf5", borderRadius: 2, width: "80%" }} />
      </div>
    ),
    luxury: (
      <div
        style={{
          width: "100%",
          padding: "4px 4px",
          border: "1.5px solid #b45309",
          borderRadius: 6,
          background: "#fffbeb",
        }}
      >
        <div style={{ height: 3, background: "#b45309", borderRadius: 2, marginBottom: 3, width: "50%" }} />
        <div style={{ height: 2, background: "#fde68a", borderRadius: 2 }} />
      </div>
    ),
    shopifyNative: (
      <div
        style={{
          width: "100%",
          padding: "0 4px",
          border: "1.5px solid #7c3aed",
          borderRadius: 3,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        <div style={{ height: 3, background: "#7c3aed", borderRadius: 1, marginBottom: 3, width: "45%" }} />
        <div style={{ height: 2, background: "#ede9fe", borderRadius: 1 }} />
      </div>
    ),
  };
  return (
    <div style={{ height: 28, display: "flex", alignItems: "center", width: "100%", marginBottom: 8 }}>
      {previews[presetId]}
    </div>
  );
}

const PRESET_ACCENTS = {
  minimal: { border: "#e2e8f0", text: "#64748b", selectedBorder: "#059669", selectedText: "#059669" },
  modern: { border: "#e2e8f0", text: "#64748b", selectedBorder: "#059669", selectedText: "#059669" },
  luxury: { border: "#fde68a", text: "#b45309", selectedBorder: "#b45309", selectedText: "#b45309" },
  shopifyNative: { border: "#ddd6fe", text: "#7c3aed", selectedBorder: "#7c3aed", selectedText: "#7c3aed" },
};

export function PresetCard({ presetId, label, selected, onClick }) {
  const accent = PRESET_ACCENTS[presetId] || PRESET_ACCENTS.modern;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px 10px 10px",
        borderRadius: 12,
        border: selected ? `2px solid ${accent.selectedBorder}` : `1px solid ${accent.border}`,
        background: TOKENS.white,
        cursor: "pointer",
        fontFamily: UI_FONT,
        fontSize: 12,
        fontWeight: 600,
        color: selected ? accent.selectedText : accent.text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        minHeight: 72,
        boxShadow: selected ? "0 1px 4px rgba(5,150,105,0.08)" : "none",
      }}
    >
      {selected ? (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: TOKENS.green,
            color: "#fff",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
          }}
        >
          ✓
        </span>
      ) : null}
      <PresetPreview presetId={presetId} />
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {label}
      </span>
    </button>
  );
}

export function SegmentControl({ options, value, onChange, showIcons = false }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        padding: 3,
        background: "#f3f4f6",
        borderRadius: 10,
        marginBottom: 14,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: "9px 6px",
              borderRadius: 8,
              border: active ? `1.5px solid ${TOKENS.green}` : "1.5px solid transparent",
              background: active ? TOKENS.white : "transparent",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: UI_FONT,
              color: active ? TOKENS.green : TOKENS.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {showIcons && opt.icon ? opt.icon : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentField({ label, valueLabel, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: TOKENS.label }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TOKENS.green }}>{valueLabel}</span>
      </div>
      <SegmentControl options={options} value={value} onChange={onChange} />
    </div>
  );
}

export function ResetButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 8,
        border: `1px solid ${TOKENS.border}`,
        background: TOKENS.white,
        color: TOKENS.textMuted,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: UI_FONT,
      }}
    >
      <RotateCcw size={14} />
      Reset
    </button>
  );
}

export function LogoDropzone({ logoUrl, onClick, onDrop }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{
        width: "100%",
        padding: logoUrl ? 16 : 24,
        border: `2px dashed ${TOKENS.border}`,
        borderRadius: 12,
        background: "#f9fafb",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
        fontFamily: UI_FONT,
      }}
    >
      {logoUrl ? (
        /* eslint-disable-next-line jsx-a11y/img-redundant-alt */
        <img src={logoUrl} alt="" style={{ maxHeight: 48, maxWidth: "100%", objectFit: "contain" }} />
      ) : (
        <>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Upload size={18} color={TOKENS.green} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: TOKENS.text }}>Drop logo here</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>PNG, SVG · Max 2MB</span>
        </>
      )}
    </button>
  );
}

export function LayoutPresetsHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        fontFamily: UI_FONT,
      }}
    >
      <SectionIcon type="layout" />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: TOKENS.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Layout presets
      </span>
    </div>
  );
}

export function StarStyleIcon({ type }) {
  if (type === "emoji") return <span style={{ fontSize: 11 }}>⭐</span>;
  if (type === "outline") return <Star size={12} fill="none" stroke="currentColor" strokeWidth={2} />;
  return <Star size={12} fill="currentColor" stroke="none" />;
}

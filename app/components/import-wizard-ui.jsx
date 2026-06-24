/* eslint-disable react/prop-types */
import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Star,
  Upload,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import {
  SHOPIFY_GREEN,
  SURFACE_BG,
  SURFACE_BORDER,
  SURFACE_MUTED,
  R,
  Badge,
  Banner,
} from "./admin-ui";

const STEPS = [
  { id: 1, label: "Choose Source" },
  { id: 2, label: "Upload CSV" },
  { id: 3, label: "Map Fields" },
  { id: 4, label: "Preview & Import" },
];

const SOURCE_COLORS = {
  loox: "#6366f1",
  judgeme: "#0ea5e9",
  stamped: "#f59e0b",
  yotpo: "#0042E4",
  okendo: "#10b981",
  amazon: "#ff9900",
  flipkart: "#2874f0",
  custom: "#6d7175",
};

function SourceLogo({ source }) {
  const color = SOURCE_COLORS[source.id] ?? "#6d7175";
  if (source.logo) {
    return (
      <img
        src={source.logo}
        alt={`${source.name} logo`}
        width={36}
        height={36}
        style={{
          width: 36,
          height: 36,
          borderRadius: R,
          flexShrink: 0,
          objectFit: "contain",
          display: "block",
          background: "#fff",
        }}
      />
    );
  }
  const initial = (source.name || "?").replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "?";
  return (
    <span
      style={{
        width: 36,
        height: 36,
        borderRadius: R,
        background: color,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: 15,
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function ImportBreadcrumb({ onReviewsClick }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: "#6d7175",
        marginBottom: 8,
      }}
    >
      <button
        type="button"
        onClick={onReviewsClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: SHOPIFY_GREEN,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        Reviews
      </button>
      <span aria-hidden>&gt;</span>
      <span style={{ color: "#202223" }}>Import via CSV</span>
    </nav>
  );
}

export function ImportStepper({ currentStep }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 28,
        gap: 4,
      }}
    >
      {STEPS.map((step, idx) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        const circleStyle = {
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          flexShrink: 0,
          border: `2px solid ${done || active ? SHOPIFY_GREEN : "#e1e3e5"}`,
          background: done || active ? SHOPIFY_GREEN : "#fff",
          color: done || active ? "#fff" : "#8c9196",
        };
        return (
          <div
            key={step.id}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              minWidth: 0,
            }}
          >
            {idx > 0 ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 16,
                  right: "50%",
                  width: "100%",
                  height: 2,
                  background: currentStep > step.id - 1 ? SHOPIFY_GREEN : "#e1e3e5",
                  zIndex: 0,
                  transform: "translateY(-50%)",
                }}
              />
            ) : null}
            <div style={{ ...circleStyle, position: "relative", zIndex: 1 }}>
              {done ? <Check size={16} strokeWidth={3} /> : step.id}
            </div>
            <span
              style={{
                marginTop: 8,
                fontSize: 11,
                fontWeight: active ? 800 : 600,
                color: active ? SHOPIFY_GREEN : "#6d7175",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SourceCard({ source, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(source.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: R,
        border: `2px solid ${selected ? SHOPIFY_GREEN : SURFACE_BORDER}`,
        background: selected ? "#ecfdf3" : SURFACE_BG,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {selected ? (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: SHOPIFY_GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={12} color="#fff" strokeWidth={3} />
        </span>
      ) : null}
      <SourceLogo source={source} />
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontWeight: 800,
            fontSize: 14,
            color: "#202223",
          }}
        >
          {source.name}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#8c9196",
            marginTop: 2,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {source.category ?? "Import source"}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "#6d7175",
            marginTop: 2,
          }}
        >
          {source.autoMapped ? "Auto mapped columns" : "Map fields manually"}
        </span>
      </span>
    </button>
  );
}

export function SourceGrid({ sources, selectedId, onSelect }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {sources.map((s) => (
        <SourceCard
          key={s.id}
          source={s}
          selected={selectedId === s.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function FileDropZone({ file, onFile, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const f = files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? SHOPIFY_GREEN : "#b3d4f0"}`,
          borderRadius: R,
          background: dragOver ? "#ecfdf3" : "#f1f8ff",
          padding: "48px 24px",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {file ? (
          <>
            <FileSpreadsheet
              size={40}
              color={SHOPIFY_GREEN}
              style={{ margin: "0 auto 12px" }}
            />
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#202223" }}>
              {file.name}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: "#6d7175" }}>
              {(file.size / 1024).toFixed(1)} KB. Click or drop to replace
            </p>
          </>
        ) : (
          <>
            <Upload size={40} color={SHOPIFY_GREEN} style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#202223" }}>
              Drop your CSV file here
            </p>
            <p
              style={{
                margin: "8px auto 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#6d7175",
                maxWidth: 420,
                lineHeight: 1.5,
              }}
            >
              Supports .csv files exported from Loox, Stamped, Yotpo, Judge.me, Okendo, Amazon,
              Flipkart, or any custom format.
            </p>
            <span
              style={{ fontSize: 12, fontWeight: 600, color: "#8c9196", display: "block", marginBottom: 12 }}
            >
              or
            </span>
            <span
              style={{
                display: "inline-flex",
                padding: "10px 20px",
                borderRadius: R,
                background: SHOPIFY_GREEN,
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Browse Files
            </span>
          </>
        )}
      </div>
      {error ? (
        <div style={{ marginTop: 12 }}>
          <Banner tone="critical">{error}</Banner>
        </div>
      ) : null}
    </div>
  );
}

export function MappingErrorsList({ errors, title = "Match these columns before you continue:" }) {
  if (!errors?.length) return null;
  return (
    <div>
      <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13 }}>{title}</p>
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.65, fontSize: 13, fontWeight: 600 }}>
        {errors.map((msg) => (
          <li key={msg}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export function ColumnMappingRow({ csvColumn, value, options, autoMatched, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 24px 1fr",
        gap: 12,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: `1px solid ${SURFACE_BORDER}`,
      }}
    >
      <span
        style={{
          padding: "8px 12px",
          borderRadius: R,
          background: SURFACE_MUTED,
          border: `1px solid ${SURFACE_BORDER}`,
          fontSize: 13,
          fontWeight: 600,
          color: "#6d7175",
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {csvColumn}
      </span>
      <ArrowRight size={16} color="#8c9196" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value={value}
          onChange={(e) => onChange(csvColumn, e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: R,
            border: "1px solid #c9cccf",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            background: "#fff",
          }}
        >
          {options.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
        {autoMatched && value !== "skip" ? (
          <CheckCircle2 size={18} color={SHOPIFY_GREEN} />
        ) : null}
      </div>
    </div>
  );
}

export function ToggleSwitch({ label, description, checked, onChange, disabled, proBadge }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 0",
        borderBottom: `1px solid ${SURFACE_BORDER}`,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#202223" }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600, color: "#6d7175", lineHeight: 1.45 }}>
          {description}
          {proBadge ? (
            <span style={{ marginLeft: 6 }}>
              <Badge tone="blue">Premium</Badge>
            </span>
          ) : null}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: checked && !disabled ? SHOPIFY_GREEN : "#e1e3e5",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked && !disabled ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          fill={n <= rating ? "#f59e0b" : "none"}
          color={n <= rating ? "#f59e0b" : "#e1e3e5"}
        />
      ))}
    </span>
  );
}

const STATUS_BADGE = {
  ready: { label: "Ready", tone: "green" },
  low_rating: { label: "Low Rating", tone: "warning" },
  duplicate: { label: "Duplicate", tone: "blue" },
  product_not_found: { label: "Not in Store", tone: "warning" },
  invalid: { label: "Invalid", tone: "red" },
};

function formatDate(d) {
  if (!d) return "N/A";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export function PreviewTable({ rows }) {
  if (!rows?.length) {
    return (
      <div style={{ textAlign: "center", padding: 24, color: "#6d7175", fontWeight: 600 }}>
        No rows to preview.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <thead>
          <tr style={{ borderBottom: `2px solid ${SURFACE_BORDER}` }}>
            {["#", "REVIEWER", "RATING", "REVIEW", "PRODUCT", "DATE", "STATUS"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#6d7175",
                  letterSpacing: "0.04em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const badge = STATUS_BADGE[row.status] ?? STATUS_BADGE.invalid;
            return (
              <tr key={row.index ?? i} style={{ borderBottom: `1px solid ${SURFACE_BORDER}` }}>
                <td style={{ padding: "12px", color: "#6d7175" }}>
                  {String(i + 1).padStart(3, "0")}
                </td>
                <td style={{ padding: "12px", fontWeight: 700 }}>{row.author || "None"}</td>
                <td style={{ padding: "12px" }}>
                  <StarRating rating={row.rating} />
                </td>
                <td
                  style={{
                    padding: "12px",
                    maxWidth: 240,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "#202223",
                  }}
                >
                  {row.comment || "None"}
                </td>
                <td
                  style={{
                    padding: "12px",
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#6d7175",
                  }}
                >
                  {row.productHandle || row.productId || "None"}
                </td>
                <td style={{ padding: "12px", color: "#6d7175" }}>
                  {formatDate(row.createdAt)}
                </td>
                <td style={{ padding: "12px" }}>
                  <Badge tone={badge.tone}>
                    {row.status === "duplicate" ? (
                      <HelpCircle size={12} style={{ marginRight: 4 }} />
                    ) : null}
                    {row.status === "low_rating" ? (
                      <AlertTriangle size={12} style={{ marginRight: 4 }} />
                    ) : null}
                    {badge.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PreviewSummary({ summary, settings }) {
  if (!summary) return null;

  const parts = [];
  const importable = summary.ready;
  if (importable > 0) {
    parts.push(`Ready to import ${importable.toLocaleString()} review${importable === 1 ? "" : "s"}.`);
  }
  if (summary.duplicate > 0) {
    parts.push(
      `${summary.duplicate} review${summary.duplicate === 1 ? "" : "s"} flagged as potential duplicate${summary.duplicate === 1 ? "" : "s"}.`,
    );
  }
  if (summary.lowRating > 0 && settings?.filterMinRating) {
    parts.push(
      `${summary.lowRating} review${summary.lowRating === 1 ? " has" : "s have"} a low rating and will be imported but not published.`,
    );
  }
  if (summary.productNotFound > 0) {
    parts.push(
      `${summary.productNotFound} review${summary.productNotFound === 1 ? "" : "s"} not matched to your catalog but will still be imported.`,
    );
  }

  return (
    <Banner tone="warning" icon={<AlertTriangle size={18} />}>
      {parts.join(" ") || "Review the preview below before importing."}
    </Banner>
  );
}

export function PreviewStats({ summary }) {
  if (!summary) return null;
  const stats = [
    { label: "Total Rows", value: summary.total, color: "#202223" },
    { label: "Ready to Import", value: summary.ready, color: SHOPIFY_GREEN },
    { label: "Potential Duplicate", value: summary.duplicate, color: "#b98900" },
    { label: "Low Rating", value: summary.lowRating, color: "#b98900" },
    { label: "Errors", value: summary.invalid, color: "#d72c0d" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 16,
        marginTop: 16,
      }}
    >
      {stats.map((s) => (
        <div key={s.label}>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 900,
              color: s.color,
            }}
          >
            {s.value.toLocaleString()}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700, color: "#6d7175" }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function StepBadge({ step, total = 4 }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: SHOPIFY_GREEN,
      }}
    >
      Step {step} of {total}
    </span>
  );
}

function exportStepText(step) {
  return typeof step === "string" ? step : step.text;
}

function exportStepLabel(step, index) {
  if (typeof step === "string") return null;
  return step.label ?? `Step ${index + 1}`;
}

export function ExportInstructions({
  title,
  steps,
  requiredFields,
  sourceName,
  onDownload,
  downloaded,
  showTemplate,
}) {
  if (!steps?.length) return null;

  const listMarginBottom = requiredFields?.length || showTemplate ? 14 : 0;

  return (
    <div
      style={{
        marginTop: 16,
        padding: "16px 18px",
        borderRadius: R,
        background: "#f6f6f7",
        border: `1px solid ${SURFACE_BORDER}`,
      }}
    >
      <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 14, color: "#202223" }}>
        {title ?? `How to get reviews from ${sourceName ?? "your source"}`}
      </p>
      <ol
        style={{
          margin: `0 0 ${listMarginBottom}px`,
          paddingLeft: requiredFields?.length ? 0 : 20,
          fontSize: 13,
          fontWeight: 600,
          color: "#5c5f62",
          lineHeight: 1.55,
          listStyle: requiredFields?.length ? "none" : undefined,
        }}
      >
        {steps.map((step, i) => {
          const label = exportStepLabel(step, i);
          const text = exportStepText(step);
          return (
            <li key={i} style={{ marginBottom: label ? 12 : 4 }}>
              {label ? (
                <span style={{ display: "block", fontWeight: 800, color: "#202223", marginBottom: 4 }}>
                  {label}
                </span>
              ) : null}
              {text}
            </li>
          );
        })}
      </ol>
      {requiredFields?.length ? (
        <div style={{ marginBottom: showTemplate ? 14 : 0 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13, color: "#202223" }}>
            Required Fields
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 13,
              fontWeight: 600,
              color: "#5c5f62",
              lineHeight: 1.55,
            }}
          >
            {requiredFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {showTemplate ? (
        <>
          <button
            type="button"
            onClick={onDownload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: R,
              border: "1px solid #c9cccf",
              background: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Upload size={14} />
            {downloaded ? "Download again" : `Download ${(sourceName ?? "").replace(/\s*CSV\s*$/i, "").trim() || "custom"} CSV template`}
          </button>
          {downloaded ? (
            <p style={{ margin: "10px 0 0", fontSize: 12, fontWeight: 600, color: SHOPIFY_GREEN }}>
              Template downloaded. Check your Downloads folder.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function TemplateDownloadBar({ sourceName, onDownload, downloaded }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: "14px 16px",
        borderRadius: R,
        background: SURFACE_MUTED,
        border: `1px solid ${SURFACE_BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6d7175", flex: 1, minWidth: 200 }}>
        Don&apos;t have a file ready? Download the {sourceName ? `${sourceName} ` : ""}CSV template with
        example rows and the correct column names for this source.
      </p>
      <button
        type="button"
        onClick={onDownload}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: R,
          border: "1px solid #c9cccf",
          background: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        <Upload size={14} />
        {downloaded ? "Downloaded ✓" : "Download Template"}
      </button>
    </div>
  );
}

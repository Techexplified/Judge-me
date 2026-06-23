/* eslint-disable react/prop-types */
import { CheckCircle2, Store, FileText } from "lucide-react";
import { OnboardingHeading } from "./onboarding-shell.jsx";

const IMPORT_OPTIONS = [
  { id: "loox", label: "Loox" },
  { id: "judgeme", label: "Judge.me" },
  { id: "amazon", label: "Amazon" },
  { id: "flipkart", label: "Flipkart" },
  { id: "csv", label: "CSV file", icon: "file" },
  { id: "skip", label: "Skip for now" },
];

export function StepConnect({
  shopName,
  importChoice,
  onImportChoiceChange,
}) {
  return (
    <div>
      <OnboardingHeading
        title="Connect your store"
        subtitle="We'll pull in your branding and existing reviews automatically."
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          borderRadius: 10,
          border: "1px solid #e1e3e5",
          background: "#fafcfb",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: "1px solid #c9cccf",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Store size={20} color="#5c5f62" strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#202223" }}>
            {shopName}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 500, color: "#6d7175" }}>
            Store detected. Logo and colors synced
          </p>
        </div>
        <CheckCircle2 size={22} color="#008060" style={{ flexShrink: 0 }} />
      </div>

      <div
        style={{
          padding: "20px 22px",
          borderRadius: 10,
          border: "1px solid #e1e3e5",
          background: "#fff",
        }}
      >
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#202223" }}>
          Import existing reviews
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            fontWeight: 500,
            color: "#6d7175",
            lineHeight: 1.5,
          }}
        >
          Already have reviews on another app? Bring them with you. Nothing gets lost.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {IMPORT_OPTIONS.map((opt) => {
            const selected = importChoice === opt.id;
            const isSkip = opt.id === "skip";
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onImportChoiceChange(opt.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: selected
                    ? "2px solid #008060"
                    : "1px solid #c9cccf",
                  background: selected ? "#ecfdf5" : "#fff",
                  color: isSkip ? "#6d7175" : "#202223",
                  fontWeight: isSkip ? 600 : 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {opt.icon === "file" ? <FileText size={16} color="#6d7175" strokeWidth={1.75} /> : null}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useSubmit, useLoaderData, useNavigation, useActionData } from "react-router";
import {
  Star,
  RotateCcw,
  Box,
  Settings2,
  Palette,
  Layout as LayoutIcon,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Save
} from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// 1. Default Configuration
const defaultConfig = {
  primaryColor: "#4A90E2",
  secondaryColor: "#64748b",
  starColor: "#fbbf24",
  buttonColor: "#008060",
  showPhotos: true,
  showVideos: true,
  showRatings: true,
  borderRadius: 12,
  shadowDepth: 4,
  fontSize: 14,
};

// 2. Loader: Server-side fetch from DB
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.settings.findUnique({ 
    where: { shop: session.shop } 
  });
  
  return { 
    savedConfig: settings ? JSON.parse(settings.config) : defaultConfig 
  };
};

// 3. Action: Server-side update to DB
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const config = formData.get("config");

  await db.settings.upsert({
    where: { shop: session.shop },
    update: { config },
    create: { shop: session.shop, config },
  });

  return { ok: true };
};

export default function ReviewEditor() {
  const { savedConfig } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [config, setConfig] = useState(savedConfig);
  const [showToast, setShowToast] = useState(false);
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  const isSaving = navigation.state === "submitting";

  // Handle Resize for Preview
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle Success Feedback
  useEffect(() => {
    if (actionData?.ok) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const isMobile = width < 768;

  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const saveConfig = () => {
    submit({ config: JSON.stringify(config) }, { method: "POST" });
  };

  const resetConfig = () => setConfig(defaultConfig);

  const styles = {
    container: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      height: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', sans-serif",
      color: config.secondaryColor,
      overflow: "hidden",
    },
    sidebar: {
      width: isMobile ? "100%" : "380px",
      backgroundColor: "#ffffff",
      borderRight: isMobile ? "none" : "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      zIndex: 20,
    },
    main: {
      flex: 1,
      overflowY: "auto",
      padding: isMobile ? "20px" : "60px",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      backgroundColor: "#f1f5f9",
    },
    formCard: {
      width: "100%",
      maxWidth: "640px",
      backgroundColor: "#ffffff",
      borderRadius: `${config.borderRadius}px`,
      boxShadow: `0 ${config.shadowDepth}px ${config.shadowDepth * 4}px rgba(0,0,0,${config.shadowDepth * 0.02 + 0.05})`,
      fontSize: `${config.fontSize}px`,
      overflow: "hidden",
      border: "1px solid #e2e8f0",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: `${config.borderRadius / 1.5}px`,
      border: `1px solid #e2e8f0`,
      fontSize: "inherit",
      outline: "none",
      marginTop: "6px",
      boxSizing: "border-box",
      color: config.secondaryColor,
    },
    uploadBox: {
      flex: 1,
      border: "2px dashed #e2e8f0",
      borderRadius: `${config.borderRadius / 1.2}px`,
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    }
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px" }}>
          <Settings2 size={24} color={config.primaryColor} />
          <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Review Customizer</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <SideSection title="Visibility" icon={<LayoutIcon size={16} />}>
           
           
            <Toggle label="Show Ratings" active={config.showRatings} onClick={() => updateConfig("showRatings", !config.showRatings)} />
          </SideSection>

          <SideSection title="Theming" icon={<Palette size={16} />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
             
              <ColorInput label="Stars" value={config.starColor} onChange={(v) => updateConfig("starColor", v)} />
              <ColorInput label="Buttons" value={config.buttonColor} onChange={(v) => updateConfig("buttonColor", v)} />
              <ColorInput label="Typography" value={config.secondaryColor} onChange={(v) => updateConfig("secondaryColor", v)} />
            </div>
          </SideSection>

          <SideSection title="Geometry" icon={<Box size={16} />}>
            <Slider label="Corners" min={0} max={40} value={config.borderRadius} onChange={(v) => updateConfig("borderRadius", v)} />
            <Slider label="Elevation" min={0} max={30} value={config.shadowDepth} onChange={(v) => updateConfig("shadowDepth", v)} />
            <Slider label="Base Text" min={12} max={18} value={config.fontSize} onChange={(v) => updateConfig("fontSize", v)} />
          </SideSection>
        </div>

        <div style={{ padding: "24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "12px" }}>
          <button onClick={resetConfig} title="Reset to Defaults" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", cursor: "pointer", backgroundColor: "#fff" }}>
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={saveConfig} 
            disabled={isSaving}
            style={{ 
              flex: 3, 
              padding: "12px", 
              backgroundColor: showToast ? "#10b981" : "#008060", 
              color: "#fff", 
              border: "none", 
              borderRadius: "10px", 
              fontWeight: "700", 
              cursor: isSaving ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {isSaving ? "Saving..." : showToast ? <><CheckCircle2 size={18}/> Updated</> : <><Save size={18}/> Save</>}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.formCard}>
          <div style={{ padding: isMobile ? "24px" : "40px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <Star size={40} fill={config.starColor} stroke={config.starColor} style={{ marginBottom: "12px" }} />
              <h1 style={{ fontSize: "24px", fontWeight: "800", color: config.secondaryColor }}>Write a Review</h1>
              <p style={{ color: config.secondaryColor, opacity: 0.8 }}>Sharing your experience helps the community.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {config.showRatings && (
                <div>
                  <label style={{ fontWeight: "700", color: config.secondaryColor }}>Your Rating *</label>
                  <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={24} fill={i <= 4 ? config.starColor : "none"} stroke={config.starColor} />)}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontWeight: "700", color: config.secondaryColor }}>Name</label>
                <input type="text" placeholder="Jane Doe" style={styles.input} />
              </div>

              <div>
                <label style={{ fontWeight: "700", color: config.secondaryColor }}>Detailed Review *</label>
                <textarea placeholder="Tell us more about the product..." style={{ ...styles.input, height: "100px", resize: "none" }} />
              </div>

              
            </div>

            <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button style={{ background: "none", border: "none", color: config.secondaryColor, cursor: "pointer", fontWeight: "600" }}>Cancel</button>
              <button style={{ 
                padding: "12px 28px", 
                backgroundColor: config.buttonColor, 
                color: "#fff", 
                border: "none", 
                borderRadius: `${config.borderRadius / 1.5}px`, 
                fontWeight: "700", 
                cursor: "pointer" 
              }}>
                Post Review
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- HELPERS ---

function SideSection({ title, icon, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px" }}>
        {icon} {title}
      </div>
      <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "14px" }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onClick}>
      <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>{label}</span>
      <div style={{ width: "34px", height: "18px", borderRadius: "20px", backgroundColor: active ? "#10b981" : "#e2e8f0", position: "relative", transition: "0.3s" }}>
        <div style={{ width: "14px", height: "14px", backgroundColor: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: active ? "18px" : "2px", transition: "0.2s" }} />
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "24px", height: "24px", border: "none", padding: 0, cursor: "pointer", borderRadius: "4px", backgroundColor: "transparent" }} />
        <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748b" }}>{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569" }}>
        <span>{label}</span>
        <span style={{ fontWeight: "800" }}>{value}px</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }} />
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useSubmit, useLoaderData, useNavigation, useActionData } from "react-router";
import { 
  Star, 
  Box, 
  Palette, 
  Layout as LayoutIcon, 
  Settings2, 
  ImageIcon, 
  Video, 
  Save,
  CheckCircle2
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

// 2. Loader: Fetches existing settings from DB
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const settings = await db.settings.findUnique({ 
    where: { shop: session.shop } 
  });

  return { 
    savedConfig: settings ? JSON.parse(settings.config) : defaultConfig 
  };
};

// 3. Action: Saves settings to DB
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const config = formData.get("config");

  try {
    await db.settings.upsert({
      where: { shop: session.shop },
      update: { config },
      create: { 
        shop: session.shop, 
        config 
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Database Save Error:", error);
    return { success: false, error: error.message };
  }
};

export default function Editor() {
  const { savedConfig } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  
  const [config, setConfig] = useState(savedConfig);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const isSaving = navigation.state === "submitting";

  // Handle toast notification when action completes successfully
  useEffect(() => {
    if (actionData?.success) {
      setShowSavedToast(true);
      const timer = setTimeout(() => setShowSavedToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = () => {
    // We send as a POST request. React Router handles the routing to the 'action' function.
    submit(
      { config: JSON.stringify(config) }, 
      { method: "POST" }
    );
  };

  const styles = {
    container: { display: "flex", height: "100vh", backgroundColor: "#f8fafc", fontFamily: "sans-serif" },
    sidebar: { 
      width: "320px", 
      backgroundColor: "#fff", 
      borderRight: "1px solid #e2e8f0", 
      display: "flex", 
      flexDirection: "column" 
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      cursor: "pointer",
      color: "#475569",
      fontSize: "14px",
      borderRadius: "8px",
      transition: "background 0.2s"
    },
    main: { 
      flex: 1, 
      padding: "60px", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "flex-start", 
      backgroundColor: "#f1f5f9", 
      overflowY: "auto" 
    },
    previewCard: {
      width: "100%", 
      maxWidth: "500px", 
      backgroundColor: "#fff",
      borderRadius: `${config.borderRadius}px`,
      boxShadow: `0 ${config.shadowDepth}px ${config.shadowDepth * 4}px rgba(0,0,0,0.1)`,
      fontSize: `${config.fontSize}px`, 
      padding: "40px", 
      border: "1px solid #e2e8f0",
      transition: "all 0.3s ease"
    },
    inputField: { 
      width: "100%", 
      padding: "12px", 
      borderRadius: `${config.borderRadius / 2}px`, 
      border: "1px solid #e2e8f0", 
      marginTop: "8px",
      outline: "none"
    }
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR NAVIGATION */}
      <aside style={styles.sidebar}>
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", fontWeight: "700", fontSize: "18px" }}>
          Widget Editor
        </div>
        
        <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
            <SideSection title="Design System" icon={<Palette size={18}/>}>
                <ColorInput label="Primary Accent" value={config.primaryColor} onChange={(v) => updateConfig("primaryColor", v)} />
                <ColorInput label="Star Rating" value={config.starColor} onChange={(v) => updateConfig("starColor", v)} />
                <ColorInput label="Submit Button" value={config.buttonColor} onChange={(v) => updateConfig("buttonColor", v)} />
            </SideSection>

            <SideSection title="Layout & Spacing" icon={<Box size={18}/>}>
                <Slider label="Corner Radius" min={0} max={40} value={config.borderRadius} onChange={(v) => updateConfig("borderRadius", v)} />
                <Slider label="Shadow Depth" min={0} max={20} value={config.shadowDepth} onChange={(v) => updateConfig("shadowDepth", v)} />
            </SideSection>

            <SideSection title="Media Content" icon={<ImageIcon size={18}/>}>
                <Toggle label="Show Customer Photos" active={config.showPhotos} onClick={() => updateConfig("showPhotos", !config.showPhotos)} />
                <Toggle label="Allow Video Reviews" active={config.showVideos} onClick={() => updateConfig("showVideos", !config.showVideos)} />
            </SideSection>

            <SideSection title="Advanced" icon={<Settings2 size={18}/>}>
                <div style={styles.menuItem}><Video size={16} /> Video Settings</div>
                <div style={styles.menuItem}><LayoutIcon size={16} /> Grid Layout</div>
            </SideSection>
        </div>

        {/* SAVE AREA */}
        <div style={{ padding: "20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#fff" }}>
          <button 
            onClick={saveConfig} 
            disabled={isSaving}
            style={{ 
              width: "100%", 
              padding: "14px", 
              backgroundColor: isSaving ? "#94a3b8" : (showSavedToast ? "#10b981" : "#008060"), 
              color: "#fff", 
              border: "none", 
              borderRadius: "8px", 
              cursor: isSaving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: "600",
              transition: "background 0.3s"
            }}
          >
            {isSaving ? "Saving..." : showSavedToast ? <><CheckCircle2 size={18}/> Saved!</> : <><Save size={18}/> Save to Storefront</>}
          </button>
        </div>
      </aside>

      {/* PREVIEW AREA */}
      <main style={styles.main}>
        <div style={styles.previewCard}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Star size={48} fill={config.starColor} stroke={config.starColor} />
            <h2 style={{ color: config.secondaryColor, marginTop: "16px", fontSize: "24px" }}>Write a Review</h2>
            <p style={{ color: "#64748b" }}>Share your experience with the community</p>
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Full Name</label>
            <input placeholder="Enter your name" style={styles.inputField} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Review</label>
            <textarea placeholder="What did you think?" style={{ ...styles.inputField, height: "100px", resize: "none" }} />
          </div>

          <button style={{ 
            marginTop: "10px", 
            width: "100%", 
            padding: "14px", 
            backgroundColor: config.buttonColor, 
            color: "#fff", 
            border: "none", 
            fontWeight: "bold",
            borderRadius: `${config.borderRadius / 2}px`,
            cursor: "default"
          }}>
            Submit Review
          </button>
        </div>
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function SideSection({ title, icon, children }) { 
    return (
        <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "700", color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {icon} {title}
            </div>
            {children}
        </div>
    ); 
}

function ColorInput({ label, value, onChange }) { 
    return (
        <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", color: "#475569", display: "block", marginBottom: "4px" }}>{label}</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ border: "1px solid #e2e8f0", cursor: "pointer", width: "32px", height: "32px", padding: "0", borderRadius: "4px" }} />
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, padding: "6px", fontSize: "12px", border: "1px solid #e2e8f0", borderRadius: "4px" }} />
            </div>
        </div>
    ); 
}

function Slider({ label, min, max, value, onChange }) { 
    return (
        <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "4px" }}>
                <span>{label}</span>
                <span style={{ fontWeight: "bold" }}>{value}px</span>
            </div>
            <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%", cursor: "pointer" }} />
        </div>
    ); 
}

function Toggle({ label, active, onClick }) {
    return (
        <div onClick={onClick} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", cursor: "pointer" }}>
            <span style={{ fontSize: "13px", color: "#475569" }}>{label}</span>
            <div style={{ width: "36px", height: "20px", backgroundColor: active ? "#008060" : "#cbd5e1", borderRadius: "10px", position: "relative", transition: "0.3s" }}>
                <div style={{ width: "14px", height: "14px", backgroundColor: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: active ? "19px" : "3px", transition: "0.3s" }} />
            </div>
        </div>
    );
}
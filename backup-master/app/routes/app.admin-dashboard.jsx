import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState } from "react";

/* ---------------- LOADER & ACTION (Standard Prisma Logic) ---------------- */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop.replace(/\/$/, "");
  const reviews = await db.review.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
  return { reviews };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const reviewId = formData.get("reviewId");
  const reply = formData.get("reply");
  try {
    await db.review.update({ where: { id: reviewId }, data: { reply } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to save reply" };
  }
};

/* ---------------- MAIN PAGE ---------------- */
export default function AdminDashboard() {
  const { reviews } = useLoaderData();
  const [selectedReview, setSelectedReview] = useState(null);

  return (
    <div style={styles.layout}>
      {/* 1. SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>ReviewsApp</div>
        <nav style={{ flex: 1 }}>
          <div style={styles.navItem}>Dashboard</div>
          <div style={styles.navItemActive}>Reviews Management</div>
          <div style={styles.navItem}>Review Form</div>
          <div style={styles.navItem}>Widget Customization</div>
        </nav>
        <div style={styles.sidebarFooter}>User</div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main style={styles.main}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <h1 style={styles.title}>Reviews Management</h1>
              <p style={styles.subtitle}>Monitor and manage your customer reviews.</p>
            </div>
            <input type="text" placeholder="Search Form Name" style={styles.searchInput} />
          </header>

          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}><input type="checkbox" /></th>
                  <th style={styles.th}>FORM NAME</th>
                  <th style={styles.th}>RATING</th>
                  <th style={styles.th}>REVIEW</th>
                  <th style={styles.th}>DATE</th>
                  <th style={styles.th}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}><input type="checkbox" /></td>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.iconCircle}>📦</div>
                        {r.productName}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating)}</span>
                    </td>
                    <td style={{ ...styles.td, color: "#64748b" }}>
                      {r.comment.substring(0, 35)}...
                    </td>
                    <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button style={styles.actionBtn} onClick={() => setSelectedReview(r)}>⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 3. MODAL (Conditional Rendering) */}
      {selectedReview && (
        <ReviewDetailsModal 
          review={selectedReview} 
          onClose={() => setSelectedReview(null)} 
        />
      )}
    </div>
  );
}

/* ---------------- MODAL COMPONENT ---------------- */
function ReviewDetailsModal({ review, onClose }) {
  const fetcher = useFetcher();
  const [replyText, setReplyText] = useState(review.reply || "");

  const handleSave = () => {
    fetcher.submit({ reviewId: review.id, reply: replyText }, { method: "POST" });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{review.productName}</h2>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
            Date: {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div style={styles.modalBody}>
          <label style={styles.label}>Review</label>
          <p style={styles.reviewText}>{review.comment}</p>
          
          <div style={styles.ratingBox}>Rating: {review.rating}/5</div>

          <div style={styles.replyArea}>
            <label style={styles.label}>Reply</label>
            <textarea 
              style={styles.textarea} 
              value={replyText} 
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response..."
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button style={styles.saveBtn} onClick={handleSave}>
                {fetcher.state === "submitting" ? "Saving..." : "Save Reply"}
              </button>
              <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- INLINE STYLES ---------------- */
const styles = {
  layout: { display: "flex", height: "100vh", backgroundColor: "#f8fafc", fontFamily: "sans-serif" },
  sidebar: { width: "240px", backgroundColor: "#ffffff", borderRight: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column" },
  logo: { fontSize: "20px", fontWeight: "bold", marginBottom: "40px", color: "#1e293b" },
  navItem: { padding: "12px 0", color: "#64748b", cursor: "pointer", fontSize: "14px" },
  navItemActive: { padding: "12px 0", color: "#1e293b", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  sidebarFooter: { fontSize: "14px", color: "#94a3b8", paddingTop: "20px", borderTop: "1px solid #f1f5f9" },
  
  main: { flex: 1, overflowY: "auto" },
  container: { padding: "40px", maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" },
  title: { fontSize: "24px", margin: "0 0 8px 0", color: "#1e293b" },
  subtitle: { fontSize: "14px", color: "#64748b", margin: 0 },
  searchInput: { padding: "10px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", width: "260px" },

  card: { backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  theadRow: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "12px 20px", fontSize: "11px", fontWeight: "bold", color: "#64748b", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "16px 20px", fontSize: "14px", color: "#1e293b" },
  productCell: { display: "flex", alignItems: "center", gap: "12px" },
  iconCircle: { width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" },
  actionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#94a3b8" },

  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "#ffffff", width: "480px", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", padding: "24px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" },
  modalBody: { display: "flex", flexDirection: "column", gap: "16px" },
  label: { fontSize: "11px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" },
  reviewText: { fontSize: "15px", lineHeight: "1.5", color: "#334155", margin: 0 },
  ratingBox: { fontSize: "13px", fontWeight: "bold", color: "#f59e0b" },
  replyArea: { backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", marginTop: "10px" },
  textarea: { width: "100%", height: "80px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px", marginTop: "8px", fontSize: "14px", resize: "none" },
  saveBtn: { backgroundColor: "#1e293b", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  cancelBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px" }
};
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { useState, useEffect } from "react";
import { 
  Star, 
  X, 
  MessageSquare, 
  ChevronRight, 
  Edit2, 
  Send,
  User,
  Store,
  TrendingUp,
  Inbox,
  CheckCircle2,
  HelpCircle,
  Info
} from "lucide-react";

import db from "../db.server";

// --- LOADER & ACTION ---
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop.replace(/\/$/, "");
  
  const reviews = await db.review.findMany({ 
    where: { shop }, 
    orderBy: { createdAt: "desc" } 
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
    : "0.0";

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const reviewsThisMonth = reviews.filter(r => new Date(r.createdAt) >= firstDayOfMonth).length;
  const reviewsLastMonth = reviews.filter(r => {
    const d = new Date(r.createdAt);
    return d >= firstDayOfLastMonth && d < firstDayOfMonth;
  }).length;

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const grouped = reviews.reduce((acc, review) => {
    const key = review.productName || "Unknown Product";
    if (!acc[key]) {
      acc[key] = { productName: key, productImage: review.productImage, reviews: [], totalRating: 0 };
    }
    acc[key].reviews.push(review);
    acc[key].totalRating += review.rating;
    return acc;
  }, {});

  const products = Object.values(grouped).map(p => ({
    ...p,
    avgRating: (p.totalRating / p.reviews.length).toFixed(1),
    reviewCount: p.reviews.length,
    latestDate: p.reviews[0].createdAt
  }));

  return { 
    products, 
    stats: {
      totalReviews,
      avgRating,
      reviewsThisMonth,
      reviewsGrowth: calculateGrowth(reviewsThisMonth, reviewsLastMonth),
    }
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const reviewId = formData.get("reviewId");
  const reply = formData.get("reply");
  
  await db.review.update({ 
    where: { id: reviewId }, 
    data: { reply, replyDate: new Date() } 
  });
  return { ok: true };
};

// --- MAIN COMPONENT ---
export default function ReviewsManagement() {
  const { products, stats } = useLoaderData();
  
  // FIX 1: Store only the ID/Name of the product, not the whole object.
  // This ensures that when the loader re-runs, we find the NEWEST data from the products array.
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Derive the active product from the fresh "products" array provided by useLoaderData
  const activeProduct = products.find(p => p.productName === selectedProductName);

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenInstructions");
    if (!hasSeen) {
      setShowInstructions(true);
    }
  }, []);

  const closeInstructions = () => {
    localStorage.setItem("hasSeenInstructions", "true");
    setShowInstructions(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.headerLayout}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0' }}>Reviews Management</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Monitor and manage your store's customer feedback.</p>
        </div>
        <button onClick={() => setShowInstructions(true)} style={styles.helpBtn}>
          <HelpCircle size={18} /> Setup Instructions
        </button>
      </header>

      {showInstructions && <InstructionModal onClose={closeInstructions} />}

      <div style={styles.statsGrid}>
        <StatCard title="Total Reviews" value={stats.totalReviews.toLocaleString()} icon={<Inbox size={20} color="#3b82f6" />} trend="up" />
        <StatCard title="Average Rating" value={stats.avgRating} isRating={true} icon={<Star size={20} color="#f59e0b" fill="#f59e0b" />} subtitle="Across all products" />
        <StatCard title="New This Month" value={stats.reviewsThisMonth} icon={<TrendingUp size={20} color="#10b981" />} trend={stats.reviewsGrowth >= 0 ? "up" : "down"} />
      </div>

      <div style={styles.tableCard}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Rating</th>
              <th style={styles.th}>Reviews</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.productName} style={styles.tr}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.imgPlaceholder}>
                      {p.productImage ? <img src={p.productImage} style={{ width: '100%' }} alt="" /> : <MessageSquare size={18} color="#94a3b8" />}
                    </div>
                    <span style={{ fontWeight: '600' }}>{p.productName}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    <span style={{ fontWeight: '700' }}>{p.avgRating}</span>
                  </div>
                </td>
                <td style={styles.td}>{p.reviewCount} Reviews</td>
                <td style={styles.td}>
                  <button onClick={() => setSelectedProductName(p.productName)} style={styles.viewBtn}>View All <ChevronRight size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeProduct && <ProductReviewsModal product={activeProduct} onClose={() => setSelectedProductName(null)} />}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ProductReviewsModal({ product, onClose }) {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={modalStyles.productIcon}><MessageSquare size={20} color="#3b82f6" /></div>
            <div>
              <h2 style={modalStyles.productTitle}>{product.productName}</h2>
              <p style={modalStyles.subTitle}>Messaging History</p>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={20}/></button>
        </div>
        
        <div style={modalStyles.scrollArea}>
          {product.reviews.map((rev) => (
            // FIX 2: Added a dynamic key. If the reply changes, this specific item resets.
            <ReviewChatItem key={`${rev.id}-${rev.reply}`} review={rev} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewChatItem({ review }) {
  const fetcher = useFetcher();
  const [isEditing, setIsEditing] = useState(!review.reply);
  const [replyText, setReplyText] = useState(review.reply || "");

  const isSubmitting = fetcher.state === "submitting";

  const handleSave = () => {
    if (!replyText.trim()) return;
    fetcher.submit({ reviewId: review.id, reply: replyText }, { method: "POST" });
    // We don't need to manually set isEditing(false) because the key change 
    // in the parent (ProductReviewsModal) will re-mount this component with the new data.
  };

  return (
    <div style={chatStyles.thread}>
      <div style={chatStyles.rowLeft}>
        <div style={chatStyles.avatar}><User size={16} color="#64748b"/></div>
        <div style={chatStyles.contentWrapper}>
          <div style={chatStyles.metaLeft}>
            <span style={chatStyles.name}>{review.author || "Customer"}</span>
            <span style={chatStyles.time}>{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          <div style={chatStyles.bubbleLeft}>
            <div style={chatStyles.starRow}>
              {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "#f59e0b" : "none"} stroke="#f59e0b" />)}
            </div>
            {review.comment}
          </div>
        </div>
      </div>

      <div style={chatStyles.rowRight}>
        <div style={chatStyles.contentWrapper}>
          <div style={chatStyles.metaRight}>
             {!isEditing && review.reply && (
              <button onClick={() => setIsEditing(true)} style={chatStyles.editBtn}>
                <Edit2 size={12}/> Edit Reply
              </button>
            )}
            <span style={{ ...chatStyles.name, color: '#008060' }}>Store Response</span>
          </div>

          {isEditing ? (
            <div style={chatStyles.inputContainer}>
              <textarea 
                style={chatStyles.replyInput} 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
              />
              <button 
                style={chatStyles.sendBtn} 
                onClick={handleSave} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "..." : <Send size={16} />}
              </button>
            </div>
          ) : (
            <div style={chatStyles.bubbleRight}>
              {review.reply}
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <CheckCircle2 size={12} color="#008060" style={{ opacity: 0.6 }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ ...chatStyles.avatar, backgroundColor: '#008060', border: 'none' }}>
          <Store size={16} color="#fff"/>
        </div>
      </div>
    </div>
  );
}

// --- REST OF YOUR COMPONENTS & STYLES (NO CHANGES NEEDED BELOW) ---

function InstructionModal({ onClose }) {
  const steps = [
    { title: "Open Theme Editor", desc: "Go to Online Store → Themes → Edit theme" },
    { title: "Select Product Page", desc: "Select 'Products' then 'Default product' from the top dropdown." },
    { title: "Add Reviews Block", desc: "Click 'Add block' in the sidebar and select 'Product Reviews'." },
    { title: "Save & Launch", desc: "Drag the block under your description and hit Save!" }
  ];

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{...modalStyles.modal, height: 'auto', maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{...modalStyles.productIcon, backgroundColor: '#f0fdf4'}}><Info size={20} color="#16a34a" /></div>
            <h2 style={modalStyles.productTitle}>Setup Instructions</h2>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={20}/></button>
        </div>
        <div style={{ padding: '24px' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={instrStyles.stepBadge}>{index + 1}</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700' }}>{step.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{step.desc}</p>
              </div>
            </div>
          ))}
          <button onClick={onClose} style={instrStyles.finishBtn}>Got it, let's go!</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, trend, isRating }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 8px 0' }}>{title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>{value}</h3>
            {isRating && <Star size={18} fill="#f59e0b" stroke="#f59e0b" />}
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: trend === 'up' ? '#10b981' : '#ef4444', fontWeight: '600' }}>{subtitle}</p>
        </div>
        <div style={styles.statIconBox}>{icon}</div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  headerLayout: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  helpBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' },
  statCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  statIconBox: { padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '12px', height: 'fit-content' },
  tableCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  th: { padding: '16px 20px', fontSize: '12px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#475569' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  imgPlaceholder: { width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  viewBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '700' },
};

const instrStyles = {
  stepBadge: { width: '28px', height: '28px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 },
  finishBtn: { width: '100%', marginTop: '12px', padding: '12px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#fff', borderRadius: '24px', width: '650px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  header: { padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  productIcon: { padding: '10px', backgroundColor: '#eff6ff', borderRadius: '12px' },
  productTitle: { margin: 0, fontSize: '18px', fontWeight: '800' },
  subTitle: { margin: 0, fontSize: '13px', color: '#64748b' },
  scrollArea: { padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' },
  closeBtn: { padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer' }
};

const chatStyles = {
  thread: { display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px', width: '100%' },
  rowLeft: { display: 'flex', gap: '12px', justifyContent: 'flex-start', alignItems: 'flex-start' },
  rowRight: { display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'flex-start' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contentWrapper: { display: 'flex', flexDirection: 'column', maxWidth: '75%', minWidth: '200px' },
  metaLeft: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' },
  metaRight: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', justifyContent: 'flex-end' },
  name: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  time: { fontSize: '11px', color: '#94a3b8' },
  bubbleLeft: { padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0 16px 16px 16px', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', wordBreak: 'break-word' },
  bubbleRight: { padding: '12px 16px', backgroundColor: '#e6f3f0', border: '1px solid #00806033', borderRadius: '16px 0 16px 16px', fontSize: '14px', color: '#004d3a', lineHeight: '1.5', wordBreak: 'break-word' },
  starRow: { display: 'flex', gap: '2px', marginBottom: '6px' },
  inputContainer: { position: 'relative', width: '100%', marginTop: '4px' },
  replyInput: { width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '2px solid #008060', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' },
  sendBtn: { position: 'absolute', right: '12px', bottom: '12px', backgroundColor: '#008060', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  editBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }
};
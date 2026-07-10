// components/manage-reviews/qa-tab.jsx
import { useState } from "react";
import { useFetcher } from "react-router";
import { SURFACE_BORDER, SHOPIFY_GREEN } from "../admin-ui";
import { Search } from "lucide-react";

function QAItem({ q }) {
    const fetcher = useFetcher();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(q.reply || "");
    const busy = fetcher.state !== "idle";

    const submit = (intent) => {
        fetcher.submit(
            { _intent: intent, questionId: q.id, reply: draft },
            { method: "post" }
        );
        setEditing(false);
    };

    const isAnswered = q.status === "ANSWERED";
    const statusBg = isAnswered ? "#e6f4ea" : "#fff3e0";
    const statusColor = isAnswered ? SHOPIFY_GREEN : "#b76e00";

    return (
        <div style={{ border: `1px solid ${SURFACE_BORDER}`, borderRadius: 12, padding: 24, marginBottom: 16, backgroundColor: "#fff", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${SURFACE_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#6b7280", backgroundColor: "#f9fafb", flexShrink: 0 }}>
                    Q
                </div>

                <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{q.author}</span>
                        <span style={{ backgroundColor: "#f3f4f6", color: "#4b5563", fontSize: 12, padding: "2px 8px", borderRadius: 12 }}>
                            {q.productName || "Unknown product"}
                        </span>
                        <span style={{ backgroundColor: statusBg, color: statusColor, fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 12 }}>
                            {isAnswered ? "Answered" : "Unanswered"}
                        </span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{q.timestamp || "Some time ago"}</span>
                    </div>

                    <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "#1f2937", lineHeight: "1.5" }}>{q.question}</p>

                    {isAnswered && !editing && (
                        <div style={{ backgroundColor: "#f4fbf7", borderLeft: `4px solid ${SHOPIFY_GREEN}`, padding: 16, borderRadius: "0 8px 8px 0", marginBottom: 16, display: "flex", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: SHOPIFY_GREEN, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                                A
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>Store owner</span>
                                    <span style={{ backgroundColor: "#e6f4ea", color: SHOPIFY_GREEN, fontSize: 11, fontWeight: 500, padding: "1px 6px", borderRadius: 4 }}>
                                        Verified merchant
                                    </span>
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>23 hours ago</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: "1.5" }}>{q.reply}</p>
                            </div>
                        </div>
                    )}

                    {editing ? (
                        <div style={{ marginTop: 12 }}>
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 6, border: `1px solid ${SURFACE_BORDER}`, outline: "none", boxSizing: "border-box", fontSize: 14 }}
                                disabled={busy}
                            />
                            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                <button onClick={() => setEditing(false)} disabled={busy} style={{ background: "none", border: `1px solid ${SURFACE_BORDER}`, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                                    Cancel
                                </button>
                                <button onClick={() => submit(isAnswered ? "editReply" : "reply")} disabled={busy} style={{ backgroundColor: SHOPIFY_GREEN, color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                                    {isAnswered ? "Save changes" : "Publish reply"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                            {isAnswered ? (
                                <>
                                    <button onClick={() => setEditing(true)} disabled={busy} style={{ background: "none", border: `1px solid ${SURFACE_BORDER}`, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151" }}>
                                        Edit reply
                                    </button>
                                    {q.replyPublished ? (
                                        <button onClick={() => submit("unpublish")} disabled={busy} style={{ background: "none", border: `1px solid ${SURFACE_BORDER}`, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151" }}>
                                            Unpublish
                                        </button>
                                    ) : (
                                        <button onClick={() => submit("editReply")} disabled={busy} style={{ backgroundColor: SHOPIFY_GREEN, color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                                            Publish reply
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditing(true)} disabled={busy} style={{ backgroundColor: SHOPIFY_GREEN, color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                        Reply
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function QATab({ questions, qaCounts }) {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [productFilter, setProductFilter] = useState("all");
    const [sort, setSort] = useState("newest");

    const filtered = questions.filter((q) => {
        if (filter === "unanswered" && q.status !== "UNANSWERED") return false;
        if (filter === "answered" && q.status !== "ANSWERED") return false;
        if (search && !q.question.toLowerCase().includes(search.toLowerCase()) &&
            !(q.productName || "").toLowerCase().includes(search.toLowerCase())) return false;
        if (productFilter !== "all" && q.productName !== productFilter) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) =>
        sort === "newest"
            ? new Date(b.createdAt) - new Date(a.createdAt)
            : new Date(a.createdAt) - new Date(b.createdAt)
    );

    const productOptions = [...new Set(questions.map(q => q.productName).filter(Boolean))];

    const tabStyle = (isActive) => ({
        background: isActive ? "#e6f4ea" : "none",
        color: isActive ? SHOPIFY_GREEN : "#001a4e",
        border: isActive ? `1px solid ${SHOPIFY_GREEN}` : "1px solid transparent",
        padding: "8px 20px",
        borderRadius: 24,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    });

    return (
        <div style={{ fontFamily: "sans-serif", padding: "8px 16px" }}>
            {/* Sub-Navigation Tabs */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center" }}>
                <button onClick={() => setFilter("all")} style={tabStyle(filter === "all")}>
                    All questions
                </button>
                <button onClick={() => setFilter("unanswered")} style={tabStyle(filter === "unanswered")}>
                    Unanswered
                    <span style={{ color: filter === "unanswered" ? SHOPIFY_GREEN : "#7a8293", fontSize: 14, fontWeight: 500, marginLeft: 8 }}>
                        {qaCounts.unanswered}
                    </span>
                </button>
                <button onClick={() => setFilter("answered")} style={tabStyle(filter === "answered")}>
                    Answered
                </button>
            </div>

            {/* Search and Filters Strip */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{ position: "relative", flexGrow: 1, display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: 14, color: "#6b7280", fontSize: 16 }}> <Search size={18} /> </span>
                    <input
                        placeholder="Search questions or products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "100%", padding: "12px 12px 12px 42px", borderRadius: 10, border: `1px solid ${SURFACE_BORDER}`, fontSize: 14, outline: "none", color: "#333", boxSizing: "border-box" }}
                    />
                </div>
                <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    style={{ padding: "0 24px 0 16px", borderRadius: 10, border: `1px solid ${SURFACE_BORDER}`, fontSize: 14, color: "#000", backgroundColor: "#fff", cursor: "pointer", minWidth: 140, outline: "none" }}
                >
                    <option value="all">All products</option>
                    {productOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={{ padding: "0 24px 0 16px", borderRadius: 10, border: `2px solid #000000`, fontSize: 14, fontWeight: 500, color: "#000", backgroundColor: "#fff", cursor: "pointer", minWidth: 140, outline: "none" }}
                >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                </select>
            </div>

            {/* Main Content Grid */}
            <div>
                {sorted.map((q) => <QAItem key={q.id} q={q} />)}
                {sorted.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "40px 0" }}>No questions available yet.</p>}
            </div>
        </div>
    );
}
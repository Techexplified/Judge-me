(function () {
    let allQuestions = [];
    let root, API, shop, productId, productName;
    let displayLimit = 5;

    // ADD THIS CONFIG BLOCK
    const config = {
        accentColor: "#13965e", // Default green from your images
        cornerStyle: "8px",     // Default border-radius
        sectionHeading: "Questions & Answers",
        storeOwnerLabel: "Store Owner"
    };

    function injectStyles() {
        const style = document.createElement("style");
        style.innerHTML = `
    #QandA-root {   
    max-width: 1200px;
      margin: 0 auto; 
      padding: 0 20px; 
      box-sizing: border-box; 
      width: 100%; 
      display: block; 
    }
    .qa-widget { 
      --accent: ${config.accentColor}; 
      --radius: ${config.cornerStyle}; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      color: #222; 
      width: 100%; 
    }
    .qa-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .qa-title { font-size: 22px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 12px; }
    .qa-count { font-size: 13px; background: var(--accent); color: #fff; padding: 2px 10px; border-radius: 20px; font-weight: 600; }
    .qa-subtitle { font-size: 14px; color: #6b7280; margin: 4px 0 0 0; }
    .qa-ask-btn { background: var(--accent); color: #fff; border: none; padding: 10px 16px; border-radius: var(--radius); font-weight: 600; cursor: pointer; }
    .qa-ask-form { border: 1px solid var(--accent); border-radius: var(--radius); padding: 24px; margin-bottom: 24px; }
    .qa-hidden { display: none !important; }
    .qa-form-title { font-size: 16px; font-weight: 700; margin: 0 0 16px 0; }
    .qa-form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .qa-form-field { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .qa-form-field label { font-size: 13px; font-weight: 600; }
    .qa-form-field input, .qa-form-field textarea { padding: 12px; border: 1px solid #e5e7eb; border-radius: var(--radius); background: #f9fafb; font-family: inherit; font-size: 14px; outline: none; }
    .qa-form-field input:focus, .qa-form-field textarea:focus { border-color: var(--accent); }
    .qa-form-field textarea { min-height: 80px; resize: vertical; }
    .qa-form-hint { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .qa-form-actions { display: flex; justify-content: flex-end; gap: 12px; }
    .qa-cancel-btn { background: #fff; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: var(--radius); cursor: pointer; font-weight: 600; }
    .qa-submit-btn { background: var(--accent); color: #fff; border: none; padding: 10px 16px; border-radius: var(--radius); font-weight: 600; cursor: pointer; }
    .qa-search-input { width: 100%; padding: 12px 16px 12px 40px; border: 1px solid #e5e7eb; border-radius: var(--radius); margin-bottom: 24px; font-size: 14px; box-sizing: border-box; background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%239ca3af" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>') no-repeat 12px center; }
    .qa-item { border: 1px solid #e5e7eb; border-radius: var(--radius); margin-bottom: 16px; padding: 20px; border-left: 3px solid #e5e7eb; background: #fff; }
    .qa-item:has(.qa-status-answered) { border-left-color: var(--accent); }
    .qa-item:has(.qa-status-pending) { border-left-color: #f59e0b; }
    .qa-question-row { display: flex; gap: 12px; }
    .qa-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }
    .qa-item:has(.qa-status-answered) .qa-icon { background: #d1fae5; color: var(--accent); }
    .qa-item:has(.qa-status-pending) .qa-icon { background: #fef3c7; color: #d97706; }
    .qa-question-content { flex: 1; }
    .qa-question-text { font-weight: 600; font-size: 15px; margin: 0 0 6px 0; }
    .qa-meta { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 6px; }
    .qa-status { font-weight: 600; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
    .qa-status-answered { background: #d1fae5; color: var(--accent); }
    .qa-status-pending { color: #d97706; }
    .qa-reply { background: #f0fdf4; padding: 16px; border-radius: var(--radius); margin: 16px 0 0 36px; border: 1px solid #bbf7d0; }
    .qa-reply-badge { background: var(--accent); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 8px; }
    .qa-reply-date { font-size: 12px; color: #6b7280; float: right; }
    .qa-reply-text { margin: 12px 0 0 0; font-size: 14px; line-height: 1.5; color: #065f46; }
    .qa-load-more { display: block; width: 100%; padding: 12px; margin-top: 16px; background: #fff; border: 1px solid #d1d5db; border-radius: var(--radius); cursor: pointer; font-weight: 600; text-align: center; color: #374151; }
    .qa-load-more:hover { background: #f9fafb; }
  `;
        document.head.appendChild(style);
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }

    function timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / 86400000);
        if (days < 1) return "today";
        if (days === 1) return "1 day ago";
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        return months === 1 ? "1 month ago" : `${months} months ago`;
    }

    function renderQuestionCard(q) {
        const answered = q.status === "ANSWERED" && q.replyPublished && q.reply;
        const replyHtml = answered
            ? `
        <div class="qa-reply">
         <span class="qa-reply-badge">★ ${config.storeOwnerLabel}</span>
          <span class="qa-reply-date">${timeAgo(q.replyDate)}</span>
          <p class="qa-reply-text">${escapeHtml(q.reply)}</p>
        </div>`
            : "";

        return `
      <div class="qa-item" data-id="${q.id}">
        <div class="qa-question-row">
          <span class="qa-icon">Q</span>
          <div class="qa-question-content">
            <p class="qa-question-text">${escapeHtml(q.question)}</p>
            <div class="qa-meta">
              <span class="qa-author">Asked by ${escapeHtml(q.author)}</span>
              <span class="qa-dot">·</span>
              <span class="qa-date">${timeAgo(q.createdAt)}</span>
              <span class="qa-status ${answered ? "qa-status-answered" : "qa-status-pending"}">
                ${answered ? "Answered" : "Awaiting answer"}
              </span>
            </div>
          </div>
        </div>
        ${replyHtml}
      </div>
    `;
    }

    function renderList(list) {
        const listEl = root.querySelector(".qa-list");
        if (!list.length) {
            listEl.innerHTML = `<p class="qa-empty">No questions found.</p>`;
            return;
        }

        // Only render up to the display limit
        const visibleList = list.slice(0, displayLimit);
        listEl.innerHTML = visibleList.map(renderQuestionCard).join("");

        // Handle the "Load More" button
        let loadMoreBtn = root.querySelector(".qa-load-more");

        if (list.length > displayLimit) {
            if (!loadMoreBtn) {
                loadMoreBtn = document.createElement("button");
                loadMoreBtn.className = "qa-load-more";
                loadMoreBtn.textContent = "Show more questions";
                loadMoreBtn.addEventListener("click", () => {
                    displayLimit += 5; // Load 5 more on click
                    renderList(list);
                });
                // Append button AFTER the list inside the widget
                root.querySelector(".qa-widget").appendChild(loadMoreBtn);
            }
        } else if (loadMoreBtn) {
            // Remove button if all questions are now visible
            loadMoreBtn.remove();
        }
    }
    function applySearch() {
        const term = root.querySelector(".qa-search-input").value.trim().toLowerCase();
        if (!term) {
            renderList(allQuestions);
            return;
        }
        const filtered = allQuestions.filter((q) =>
            (q.question || "").toLowerCase().includes(term) ||
            (q.productName || "").toLowerCase().includes(term)
        );
        renderList(filtered);
    }

    function renderShell() {
        root.innerHTML = `
      <div class="qa-widget">
        <div class="qa-header">
          <div>
            <h3 class="qa-title">${config.sectionHeading} <span class="qa-count">${allQuestions.length} questions</span></h3>
            <p class="qa-subtitle">Real answers our team</p>
          </div>
          <button type="button" class="qa-ask-btn">+ Ask a question</button>
        </div>

        <form class="qa-ask-form qa-hidden">
          <h4 class="qa-form-title">Ask a question about this product</h4>
          <div class="qa-form-row">
            <div class="qa-form-field">
              <label>Your name</label>
              <input type="text" name="author" placeholder="e.g. Alex K." required />
            </div>
          <!--  <div class="qa-form-field">
              <label>Your email (to get notified)</label>
              <input type="email" name="email" placeholder="you@email.com" />
            </div> -->
          </div>
          <div class="qa-form-field">
            <label>Your question</label>
            <textarea name="question" placeholder="e.g. Is this suitable for beginners?" required></textarea>
          </div>
          <p class="qa-form-hint">Be specific — detailed questions get faster, more useful answers.</p>
          <div class="qa-form-actions">
            <button type="button" class="qa-cancel-btn">Cancel</button>
            <button type="submit" class="qa-submit-btn">Submit question</button>
          </div>
        </form>

        <input type="text" class="qa-search-input" placeholder="Search questions..." />

        <div class="qa-list"></div>
      </div>
    `;
    }

    function bindEvents() {
        root.querySelector(".qa-ask-btn").addEventListener("click", () => {
            root.querySelector(".qa-ask-form").classList.toggle("qa-hidden");
        });

        root.querySelector(".qa-cancel-btn").addEventListener("click", () => {
            root.querySelector(".qa-ask-form").classList.add("qa-hidden");
        });

        root.querySelector(".qa-ask-form").addEventListener("submit", handleSubmit);

        root.querySelector(".qa-search-input").addEventListener("input", applySearch);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const author = form.author.value.trim();
        const email = form.email.value.trim();
        const question = form.question.value.trim();
        if (!author || !question) return;

        const submitBtn = form.querySelector(".qa-submit-btn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        try {
            const res = await fetch(`${API}/api/public/qa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shop, productId, productName, author, email, question }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            allQuestions.unshift(data.question);
            renderShell();
            bindEvents();
            renderList(allQuestions);
        } catch (err) {
            console.error("[QandA] submit failed:", err);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit question";
        }
    }

    async function init() {
        root = document.getElementById("QandA-root");
        if (!root) return;

        shop = root.dataset.shop;
        API = (root.dataset.apiBase || "").replace(/\/$/, "");
        productId = root.dataset.productId;
        productName = root.dataset.productName || "";

        if (!API || !shop) {
            console.error("[QandA] Missing shop or API base");
            return;
        }

        injectStyles();

        root.innerHTML = `<p class="qa-loading">Loading Questions & Answers...</p>`;

        try {
            const res = await fetch(`${API}/api/public/qa?shop=${encodeURIComponent(shop)}&productId=${encodeURIComponent(productId)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            allQuestions = data.questions || [];

            renderShell();
            bindEvents();
            renderList(allQuestions);
        } catch (err) {
            console.error("[QandA] load failed:", err);
            root.innerHTML = `<p class="qa-error">Could not load Questions & Answers.</p>`;
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
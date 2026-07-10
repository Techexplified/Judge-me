(function () {
  let allQuestions = [];
  let root, API, shop, productId, productName;
  let displayLimit = 5;
  let stylesInjected = false;

  const config = {
    accentColor: "#13965e",
    cornerStyle: "8px",
    sectionHeading: "Questions & Answers",
    storeOwnerLabel: "Store Owner",
  };

  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-judgeme-qa", "1");
    style.textContent = `
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
    .qa-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .qa-title { font-size: 22px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
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
    .qa-submit-btn:disabled, .qa-ask-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .qa-search-input { width: 100%; padding: 12px 16px 12px 40px; border: 1px solid #e5e7eb; border-radius: var(--radius); margin-bottom: 24px; font-size: 14px; box-sizing: border-box; background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%239ca3af" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>') no-repeat 12px center; }
    .qa-item { border: 1px solid #e5e7eb; border-radius: var(--radius); margin-bottom: 16px; padding: 20px; border-left: 3px solid #e5e7eb; background: #fff; }
    .qa-item.qa-answered { border-left-color: var(--accent); }
    .qa-item.qa-pending { border-left-color: #f59e0b; }
    .qa-question-row { display: flex; gap: 12px; }
    .qa-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }
    .qa-item.qa-answered .qa-icon { background: #d1fae5; color: var(--accent); }
    .qa-item.qa-pending .qa-icon { background: #fef3c7; color: #d97706; }
    .qa-question-content { flex: 1; }
    .qa-question-text { font-weight: 600; font-size: 15px; margin: 0 0 6px 0; }
    .qa-meta { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .qa-status { font-weight: 600; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
    .qa-status-answered { background: #d1fae5; color: var(--accent); }
    .qa-status-pending { color: #d97706; }
    .qa-reply { background: #f0fdf4; padding: 16px; border-radius: var(--radius); margin: 16px 0 0 36px; border: 1px solid #bbf7d0; }
    .qa-reply-badge { background: var(--accent); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 8px; }
    .qa-reply-date { font-size: 12px; color: #6b7280; float: right; }
    .qa-reply-text { margin: 12px 0 0 0; font-size: 14px; line-height: 1.5; color: #065f46; }
    .qa-load-more { display: block; width: 100%; padding: 12px; margin-top: 16px; background: #fff; border: 1px solid #d1d5db; border-radius: var(--radius); cursor: pointer; font-weight: 600; text-align: center; color: #374151; }
    .qa-load-more:hover { background: #f9fafb; }
    .qa-empty, .qa-loading, .qa-error { color: #6b7280; padding: 16px 0; }
    .qa-error { color: #b91c1c; }
    .qa-form-error { color: #b91c1c; font-size: 13px; margin: 0 0 12px 0; }
  `;
    document.head.appendChild(style);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (Number.isNaN(diff)) return "";
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  function isAnswered(q) {
    return q.status === "ANSWERED" && q.replyPublished && q.reply;
  }

  function renderQuestionCard(q) {
    const answered = isAnswered(q);
    const replyHtml = answered
      ? `
        <div class="qa-reply">
          <span class="qa-reply-badge">${escapeHtml(config.storeOwnerLabel)}</span>
          <span class="qa-reply-date">${escapeHtml(timeAgo(q.replyDate))}</span>
          <p class="qa-reply-text">${escapeHtml(q.reply)}</p>
        </div>`
      : "";

    return `
      <div class="qa-item ${answered ? "qa-answered" : "qa-pending"}" data-id="${escapeHtml(q.id)}">
        <div class="qa-question-row">
          <span class="qa-icon">Q</span>
          <div class="qa-question-content">
            <p class="qa-question-text">${escapeHtml(q.question)}</p>
            <div class="qa-meta">
              <span class="qa-author">Asked by ${escapeHtml(q.author)}</span>
              <span class="qa-dot">·</span>
              <span class="qa-date">${escapeHtml(timeAgo(q.createdAt))}</span>
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

  function updateCount() {
    const countEl = root.querySelector(".qa-count");
    if (countEl) {
      const n = allQuestions.length;
      countEl.textContent = `${n} question${n === 1 ? "" : "s"}`;
    }
  }

  function renderList(list) {
    const listEl = root.querySelector(".qa-list");
    if (!listEl) return;

    if (!list.length) {
      listEl.innerHTML = `<p class="qa-empty">No questions yet. Be the first to ask.</p>`;
    } else {
      const visibleList = list.slice(0, displayLimit);
      listEl.innerHTML = visibleList.map(renderQuestionCard).join("");
    }

    let loadMoreBtn = root.querySelector(".qa-load-more");
    if (list.length > displayLimit) {
      if (!loadMoreBtn) {
        loadMoreBtn = document.createElement("button");
        loadMoreBtn.type = "button";
        loadMoreBtn.className = "qa-load-more";
        loadMoreBtn.textContent = "Show more questions";
        loadMoreBtn.addEventListener("click", () => {
          displayLimit += 5;
          renderList(list);
        });
        root.querySelector(".qa-widget")?.appendChild(loadMoreBtn);
      }
    } else if (loadMoreBtn) {
      loadMoreBtn.remove();
    }
  }

  function applySearch() {
    const input = root.querySelector(".qa-search-input");
    const term = (input?.value || "").trim().toLowerCase();
    if (!term) {
      renderList(allQuestions);
      return;
    }
    const filtered = allQuestions.filter((q) =>
      (q.question || "").toLowerCase().includes(term) ||
      (q.author || "").toLowerCase().includes(term),
    );
    renderList(filtered);
  }

  function renderShell() {
    root.innerHTML = `
      <div class="qa-widget">
        <div class="qa-header">
          <div>
            <h3 class="qa-title">${escapeHtml(config.sectionHeading)} <span class="qa-count">${allQuestions.length} question${allQuestions.length === 1 ? "" : "s"}</span></h3>
            <p class="qa-subtitle">Real answers from our team</p>
          </div>
          <button type="button" class="qa-ask-btn">+ Ask a question</button>
        </div>

        <form class="qa-ask-form qa-hidden" novalidate>
          <h4 class="qa-form-title">Ask a question about this product</h4>
          <p class="qa-form-error qa-hidden" role="alert"></p>
          <div class="qa-form-row">
            <div class="qa-form-field">
              <label for="qa-author">Your name</label>
              <input id="qa-author" type="text" name="author" placeholder="e.g. Alex K." required maxlength="80" autocomplete="name" />
            </div>
          </div>
          <div class="qa-form-field">
            <label for="qa-question">Your question</label>
            <textarea id="qa-question" name="question" placeholder="e.g. Is this suitable for beginners?" required maxlength="1000"></textarea>
          </div>
          <p class="qa-form-hint">Be specific — detailed questions get faster, more useful answers.</p>
          <div class="qa-form-actions">
            <button type="button" class="qa-cancel-btn">Cancel</button>
            <button type="submit" class="qa-submit-btn">Submit question</button>
          </div>
        </form>

        <input type="search" class="qa-search-input" placeholder="Search questions..." aria-label="Search questions" />

        <div class="qa-list"></div>
      </div>
    `;
  }

  function setFormError(message) {
    const el = root.querySelector(".qa-form-error");
    if (!el) return;
    if (!message) {
      el.textContent = "";
      el.classList.add("qa-hidden");
      return;
    }
    el.textContent = message;
    el.classList.remove("qa-hidden");
  }

  function bindEvents() {
    root.querySelector(".qa-ask-btn")?.addEventListener("click", () => {
      root.querySelector(".qa-ask-form")?.classList.toggle("qa-hidden");
      setFormError("");
    });

    root.querySelector(".qa-cancel-btn")?.addEventListener("click", () => {
      root.querySelector(".qa-ask-form")?.classList.add("qa-hidden");
      setFormError("");
    });

    root.querySelector(".qa-ask-form")?.addEventListener("submit", handleSubmit);
    root.querySelector(".qa-search-input")?.addEventListener("input", applySearch);
  }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const author = form.author.value.trim();
        // const email = form.email.value.trim();
        const question = form.question.value.trim();
        if (!author || !question) return;
  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const author = (form.author?.value || "").trim();
    const question = (form.question?.value || "").trim();
    setFormError("");

    if (!author || !question) {
      setFormError("Please enter your name and question.");
      return;
    }
    if (!shop || !productId || !API) {
      setFormError("This product is missing store details. Refresh and try again.");
      return;
    }

    const submitBtn = form.querySelector(".qa-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

        try {
            const res = await fetch(`${API}/api/public/qa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shop, productId, productName, author, question }),
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
      root.innerHTML = `<p class="qa-error">Could not load Questions & Answers.</p>`;
      return;
    }

    if (!productId) {
      console.error("[QandA] Missing productId — place this block on a product template");
      root.innerHTML = `<p class="qa-error">Questions & Answers is available on product pages only.</p>`;
      return;
    }

    injectStyles();
    root.innerHTML = `<p class="qa-loading">Loading Questions & Answers...</p>`;

    try {
      const res = await fetch(
        `${API}/api/public/qa?shop=${encodeURIComponent(shop)}&productId=${encodeURIComponent(productId)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allQuestions = Array.isArray(data.questions) ? data.questions : [];

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

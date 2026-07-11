/* eslint-disable react/prop-types */

const MOCK_QA = [
    {
      id: "1",
      question: "Does this product run true to size?",
      author: "Jessica M.",
      dateLabel: "1 month ago",
      status: "ANSWERED",
      replyPublished: true,
      reply: "Yes, it generally runs true to size. We recommend checking our sizing chart for exact measurements to ensure the perfect fit.",
      replyDateLabel: "1 month ago"
    },
    {
      id: "2",
      question: "Is the material machine washable?",
      author: "David P.",
      dateLabel: "2 months ago",
      status: "ANSWERED",
      replyPublished: true,
      reply: "Absolutely! We recommend washing on a cold, gentle cycle and tumble drying on low to preserve the fabric quality.",
      replyDateLabel: "2 months ago"
    },
    {
      id: "3",
      question: "How long does standard shipping usually take?",
      author: "Samantha T.",
      dateLabel: "3 months ago",
      status: "ANSWERED",
      replyPublished: true,
      reply: "Standard shipping typically takes 3-5 business days within the continental US. You'll receive a tracking number once it ships.",
      replyDateLabel: "3 months ago"
    },
    {
      id: "4",
      question: "Can I request a custom color?",
      author: "Michael B.",
      dateLabel: "today",
      status: "PENDING",
      replyPublished: false,
      reply: null,
      replyDateLabel: null
    },
  ];
  
  export function WidgetQAPreview({ config }) {
    const {
      heading = "Questions & Answers",
      storeOwnerLabel = "Store Owner",
      questionsPerPage = 5,
      showQuestionCount = true,
      fontFamily = "inherit",
      accentColor = "#13965e",
      cardBackgroundColor = "#ffffff",
      borderRadius = 8,
    } = config;
  
    const visibleQuestions = MOCK_QA.slice(0, Math.min(questionsPerPage, MOCK_QA.length));
    const totalCount = MOCK_QA.length;
  
    return (
      <section
        style={{
          fontFamily:
            fontFamily === "inherit"
              ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              : fontFamily,
          padding: "32px 24px",
          width: "100%",
          boxSizing: "border-box",
          maxWidth: 1200,
          margin: "0 auto",
          color: "#222"
        }}
      >
        <style>{`
          .preview-qa-widget {
            --accent: ${accentColor};
            --radius: ${borderRadius}px;
            --card-bg: ${cardBackgroundColor};
            width: 100%;
          }
          .preview-qa-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
          .preview-qa-title { font-size: 22px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
          .preview-qa-count { font-size: 13px; background: var(--accent); color: #fff; padding: 2px 10px; border-radius: 20px; font-weight: 600; }
          .preview-qa-subtitle { font-size: 14px; color: #6b7280; margin: 4px 0 0 0; }
          .preview-qa-ask-btn { background: var(--accent); color: #fff; border: none; padding: 10px 16px; border-radius: var(--radius); font-weight: 600; cursor: pointer; font-family: inherit; }
          
          .preview-qa-search-input { width: 100%; padding: 12px 16px 12px 40px; border: 1px solid #e5e7eb; border-radius: var(--radius); margin-bottom: 24px; font-size: 14px; box-sizing: border-box; background: var(--card-bg) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%239ca3af" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>') no-repeat 12px center; font-family: inherit; }
          
          .preview-qa-item { border: 1px solid #e5e7eb; border-radius: var(--radius); margin-bottom: 16px; padding: 20px; border-left: 3px solid #e5e7eb; background: var(--card-bg); }
          .preview-qa-item.qa-answered { border-left-color: var(--accent); }
          .preview-qa-item.qa-pending { border-left-color: #f59e0b; }
          
          .preview-qa-question-row { display: flex; gap: 12px; }
          .preview-qa-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }
          .preview-qa-item.qa-answered .preview-qa-icon { background: #d1fae5; color: var(--accent); }
          .preview-qa-item.qa-pending .preview-qa-icon { background: #fef3c7; color: #d97706; }
          
          .preview-qa-question-content { flex: 1; }
          .preview-qa-question-text { font-weight: 600; font-size: 15px; margin: 0 0 6px 0; }
          .preview-qa-meta { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
          
          .preview-qa-status { font-weight: 600; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .preview-qa-status-answered { background: #d1fae5; color: var(--accent); }
          .preview-qa-status-pending { color: #d97706; }
          
          .preview-qa-reply { background: #f0fdf4; padding: 16px; border-radius: var(--radius); margin: 16px 0 0 36px; border: 1px solid #bbf7d0; }
          .preview-qa-reply-badge { background: var(--accent); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 8px; }
          .preview-qa-reply-date { font-size: 12px; color: #6b7280; float: right; }
          .preview-qa-reply-text { margin: 12px 0 0 0; font-size: 14px; line-height: 1.5; color: #065f46; }
          
          .preview-qa-load-more { display: block; width: 100%; padding: 12px; margin-top: 16px; background: var(--card-bg); border: 1px solid #d1d5db; border-radius: var(--radius); cursor: pointer; font-weight: 600; text-align: center; color: #374151; font-family: inherit; }
          .preview-qa-load-more:hover { background: #f9fafb; }
        `}</style>
  
        <div className="preview-qa-widget">
          {/* Header Section */}
          <div className="preview-qa-header">
            <div>
              <h3 className="preview-qa-title">
                {heading}
                {showQuestionCount && (
                  <span className="preview-qa-count">
                    {totalCount} question{totalCount === 1 ? "" : "s"}
                  </span>
                )}
              </h3>
              <p className="preview-qa-subtitle">Real answers from our team</p>
            </div>
            <button type="button" className="preview-qa-ask-btn">
              + Ask a question
            </button>
          </div>
  
          {/* Search Input */}
          <input
            type="search"
            className="preview-qa-search-input"
            placeholder="Search questions..."
            aria-label="Search questions"
            readOnly
          />
  
          {/* Question List */}
          <div className="preview-qa-list">
            {visibleQuestions.map((q) => {
              const isAnswered = q.status === "ANSWERED" && q.replyPublished && q.reply;
  
              return (
                <div
                  key={q.id}
                  className={`preview-qa-item ${isAnswered ? "qa-answered" : "qa-pending"}`}
                >
                  <div className="preview-qa-question-row">
                    <span className="preview-qa-icon">Q</span>
                    <div className="preview-qa-question-content">
                      <p className="preview-qa-question-text">{q.question}</p>
                      <div className="preview-qa-meta">
                        <span className="preview-qa-author">Asked by {q.author}</span>
                        <span className="preview-qa-dot">·</span>
                        <span className="preview-qa-date">{q.dateLabel}</span>
                        <span
                          className={`preview-qa-status ${
                            isAnswered ? "preview-qa-status-answered" : "preview-qa-status-pending"
                          }`}
                        >
                          {isAnswered ? "Answered" : "Awaiting answer"}
                        </span>
                      </div>
                    </div>
                  </div>
  
                  {isAnswered && (
                    <div className="preview-qa-reply">
                      <span className="preview-qa-reply-badge">{storeOwnerLabel}</span>
                      <span className="preview-qa-reply-date">{q.replyDateLabel}</span>
                      <p className="preview-qa-reply-text">{q.reply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
  
          {/* Load More Mock */}
          {questionsPerPage < totalCount && (
            <button type="button" className="preview-qa-load-more">
              Show more questions
            </button>
          )}
        </div>
      </section>
    );
  }
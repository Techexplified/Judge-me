/* eslint-disable react/prop-types */
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { SURFACE_BORDER } from "../admin-ui";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const TAG_STYLES = {
  New: { bg: "#fff4e5", color: "#8a6116" },
  Widgets: { bg: "#ecfdf5", color: "#047857" },
};

const WHATS_NEW_ITEMS = [
  {
    id: "social-showcase",
    tag: "New",
    date: "July 4, 2026",
    title: "Social showcase feature",
    description:
      "Share your reviews on Instagram with one link. Add it to your bio and turn followers into buyers.",
    cta: "Get my link",
    href: "/app/manage-reviews?tab=social-showcase",
  },
  {
    id: "testimonials",
    tag: "Widgets",
    date: "July 4, 2026",
    title: "Try our new widget for store reviews",
    description: "Testimonials UI matching our current theme.",
    cta: "Learn more",
    href: "/app/widgets",
  },
];

function WhatsNewCard({ item, href }) {
  const tagStyle = TAG_STYLES[item.tag] || TAG_STYLES.Widgets;

  return (
    <article
      style={{
        background: "#fff",
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 10,
        padding: "14px 16px 16px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 8px",
            borderRadius: 999,
            background: tagStyle.bg,
            color: tagStyle.color,
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {item.tag}
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 500,
            color: "#8c9196",
            whiteSpace: "nowrap",
          }}
        >
          {item.date}
        </span>
      </div>

      <h3
        style={{
          margin: "0 0 8px",
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 700,
          color: "#202223",
          lineHeight: 1.35,
        }}
      >
        {item.title}
      </h3>
      <p
        style={{
          margin: 0,
          flex: 1,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 400,
          color: "#6d7175",
          lineHeight: 1.5,
        }}
      >
        {item.description}
      </p>
      <Link
        to={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 14,
          padding: "7px 11px",
          width: "fit-content",
          borderRadius: 8,
          border: `1px solid ${SURFACE_BORDER}`,
          background: "#fff",
          color: "#202223",
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {item.cta}
        <ArrowRight size={13} strokeWidth={2.25} />
      </Link>
    </article>
  );
}

export function WhatsNewSection({ resolveHref }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2
        style={{
          margin: "0 0 12px",
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: 800,
          color: "#202223",
        }}
      >
        What is new
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {WHATS_NEW_ITEMS.map((item) => (
          <WhatsNewCard key={item.id} item={item} href={resolveHref(item.href)} />
        ))}
      </div>
    </section>
  );
}

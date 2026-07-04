/* eslint-disable react/prop-types */
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { SHOPIFY_GREEN, SURFACE_BG, SURFACE_BORDER } from "../admin-ui";

const FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

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
  return (
    <article
      style={{
        background: SURFACE_BG,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 220,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 16px",
          background: "#ecfdf5",
          borderBottom: `1px solid ${SURFACE_BORDER}`,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            background: SHOPIFY_GREEN,
            color: "#fff",
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.02em",
          }}
        >
          {item.tag}
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 600,
            color: "#6d7175",
          }}
        >
          {item.date}
        </span>
      </div>

      <div style={{ padding: "18px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          style={{
            margin: "0 0 10px",
            fontFamily: FONT,
            fontSize: 18,
            fontWeight: 800,
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
            fontSize: 13,
            fontWeight: 500,
            color: "#6d7175",
            lineHeight: 1.55,
          }}
        >
          {item.description}
        </p>
        <Link
          to={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 18,
            padding: "10px 14px",
            width: "fit-content",
            borderRadius: 8,
            border: `1px solid ${SURFACE_BORDER}`,
            background: "#fff",
            color: "#202223",
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {item.cta}
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export function WhatsNewSection({ resolveHref }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2
        style={{
          margin: "0 0 16px",
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 900,
          color: "#202223",
        }}
      >
        What is new
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {WHATS_NEW_ITEMS.map((item) => (
          <WhatsNewCard key={item.id} item={item} href={resolveHref(item.href)} />
        ))}
      </div>
    </section>
  );
}

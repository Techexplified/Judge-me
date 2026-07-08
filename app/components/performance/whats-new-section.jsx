/* eslint-disable react/prop-types */
import { useState } from "react"; // Added useState to track hover state
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { SURFACE_BORDER } from "../admin-ui";
import socialshowcaseimg from "./social-showcase-image.webp";
import testimonialsimg from "./testimonials-2.jpeg";

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
    title: "Social showcase feature",
    previewImg: socialshowcaseimg,
    description:
      "Share your reviews on Instagram with one link. Add it to your bio and turn followers into buyers.",
    cta: "Get my link",
    href: "/app/manage-reviews?tab=social-showcase",
  },
  {
    id: "testimonials",
    tag: "Widgets",
    title: "Try our new widget for store reviews",
    previewImg: testimonialsimg,
    description: "Testimonials UI matching our current theme.",
    cta: "Learn more",
    href: "/app/widgets",
  },
];

function WidgetPreview({ previewImage, title }) {
  if (!previewImage) return null;
  
  return (
    <img
      src={previewImage}
      alt={`${title} preview`}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        display: "block",
      }}
    />
  );
}

function WhatsNewCard({ item, href, isHovered, onMouseEnter, onMouseLeave }) {
  const tagStyle = TAG_STYLES[item.tag] || TAG_STYLES.Widgets;

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: "#fff",
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 12,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        
        //  Hover effects
        cursor: "pointer",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        transform: isHovered ? "scale(1.02)" : "scale(1)",
        boxShadow: isHovered 
          ? "0 12px 24px rgba(0, 0, 0, 0.08)" 
          : "0 2px 4px rgba(0, 0, 0, 0.01)",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
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
      </div>

      <h3
        style={{
          margin: "0 0 14px",
          fontFamily: FONT,
          fontSize: 16,
          fontWeight: 800,
          color: "#202223",
          lineHeight: 1.3,
        }}
      >
        {item.title}
      </h3>

      <div style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "#fafcfb",
        borderRadius: 6,
        overflow: "hidden",
        marginBottom: 14,
        filter: "blur(2px)",
      }}>
        <WidgetPreview previewImage={item.previewImg} title={item.title} />
      </div>

      <p
        style={{
          margin: "0 0 16px",
          flex: 1,
          fontFamily: FONT,
          fontSize: 13,
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
          padding: "8px 14px",
          width: "fit-content",
          borderRadius: 8,
          border: `1px solid ${SURFACE_BORDER}`,
          background: "#fff",
          color: "#202223",
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
      >
        {item.cta}
        <ArrowRight size={14} strokeWidth={2.5} />
      </Link>
    </article>
  );
}

export function WhatsNewSection({ resolveHref }) {
 
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <section style={{ marginTop: 32, padding: "0 4px" }}>
      <h2
        style={{
          margin: "0 0 16px",
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 900,
          color: "#202223",
          letterSpacing: "-0.02em",
        }}
      >
        What is new
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {WHATS_NEW_ITEMS.map((item) => (
          <WhatsNewCard 
            key={item.id} 
            item={item} 
            href={resolveHref(item.href)} 
            isHovered={hoveredId === item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))}
      </div>
    </section>
  );
}

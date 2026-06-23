/* eslint-disable react/prop-types */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, CRITICAL_RED, CHART_LEGEND, CHART_TICK, CHART_TOOLTIP, modalStyles } from "./analytics-styles.js";

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

function ChartEmpty({ message = "No data for this period" }) {
  return <div style={modalStyles.emptyChart}>{message}</div>;
}

function ChartSurface({ height, children }) {
  return <div style={modalStyles.chartSurface(height)}>{children}</div>;
}

export function VolumeStackedChart({ data }) {
  if (!data?.length) return <ChartEmpty />;
  const chartHeight = 260;
  return (
    <div style={modalStyles.chartBlock}>
      <h3 style={modalStyles.chartTitle}>Reviews by day (stacked by rating)</h3>
      <ChartSurface height={chartHeight}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" />
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={CHART_TICK} />
          <YAxis allowDecimals={false} tick={CHART_TICK} />
          <Tooltip labelFormatter={(l) => `Date: ${l}`} contentStyle={CHART_TOOLTIP} />
          <Legend wrapperStyle={CHART_LEGEND} />
          <Bar dataKey="r5" stackId="a" fill={CHART_COLORS.r5} name="5★" />
          <Bar dataKey="r4" stackId="a" fill={CHART_COLORS.r4} name="4★" />
          <Bar dataKey="r3" stackId="a" fill={CHART_COLORS.r3} name="3★" />
          <Bar dataKey="r2" stackId="a" fill={CHART_COLORS.r2} name="2★" />
          <Bar dataKey="r1" stackId="a" fill={CHART_COLORS.r1} name="1★" />
        </BarChart>
      </ResponsiveContainer>
      </ChartSurface>
    </div>
  );
}

export function RatingDistributionChart({ data }) {
  if (!data?.length || data.every((d) => d.count === 0)) return <ChartEmpty />;
  const chartHeight = 220;
  return (
    <div style={modalStyles.chartBlock}>
      <h3 style={modalStyles.chartTitle}>Star distribution</h3>
      <ChartSurface height={chartHeight}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={CHART_TICK} />
          <YAxis type="category" dataKey="star" tickFormatter={(v) => `${v}★`} tick={CHART_TICK} width={36} />
          <Tooltip formatter={(v) => [v, "Reviews"]} contentStyle={CHART_TOOLTIP} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.star} fill={CHART_COLORS[`r${entry.star}`] || CHART_COLORS.r3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </ChartSurface>
    </div>
  );
}

export function RatingTrendChart({ data }) {
  if (!data?.length) return <ChartEmpty message="Need more reviews to show rating trend" />;
  const chartHeight = 220;
  return (
    <div style={modalStyles.chartBlock}>
      <h3 style={modalStyles.chartTitle}>7 day rolling average rating</h3>
      <ChartSurface height={chartHeight}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" />
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={CHART_TICK} />
          <YAxis domain={[1, 5]} tick={CHART_TICK} />
          <Tooltip
            labelFormatter={(l) => `Date: ${l}`}
            formatter={(v) => [v, "Avg rating"]}
            contentStyle={CHART_TOOLTIP}
          />
          <Line type="monotone" dataKey="avg" stroke={CHART_COLORS.trend} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      </ChartSurface>
    </div>
  );
}

export function VelocityAreaChart({ data }) {
  if (!data?.length) return <ChartEmpty />;
  const chartHeight = 240;
  return (
    <div style={modalStyles.chartBlock}>
      <h3 style={modalStyles.chartTitle}>Weekly review volume</h3>
      <ChartSurface height={chartHeight}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" />
          <XAxis dataKey="week" tickFormatter={formatShortDate} tick={CHART_TICK} />
          <YAxis allowDecimals={false} tick={CHART_TICK} />
          <Tooltip labelFormatter={(l) => `Week of ${l}`} contentStyle={CHART_TOOLTIP} />
          <Area type="monotone" dataKey="total" stroke={CHART_COLORS.trend} fill={CHART_COLORS.area} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      </ChartSurface>
    </div>
  );
}

export function SentimentDonutChart({ positivePct, neutralPct, negativePct, activeSegment, onSegmentClick }) {
  const data = [
    { name: "Positive", value: positivePct, key: "positive", fill: CHART_COLORS.positive },
    { name: "Neutral", value: neutralPct, key: "neutral", fill: CHART_COLORS.neutral },
    { name: "Negative", value: negativePct, key: "negative", fill: CHART_COLORS.negative },
  ].filter((d) => d.value > 0);

  if (!data.length) return <ChartEmpty />;

  const chartHeight = 240;
  return (
    <div style={modalStyles.chartBlock}>
      <h3 style={modalStyles.chartTitle}>Sentiment breakdown</h3>
      <ChartSurface height={chartHeight}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            onClick={(_, idx) => onSegmentClick?.(data[idx]?.key)}
            style={{ cursor: onSegmentClick ? "pointer" : "default" }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={entry.fill}
                opacity={activeSegment && activeSegment !== entry.key ? 0.45 : 1}
                stroke={activeSegment === entry.key ? "#202223" : "none"}
                strokeWidth={activeSegment === entry.key ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${v}%`, "Share"]} contentStyle={CHART_TOOLTIP} />
          <Legend wrapperStyle={CHART_LEGEND} />
        </PieChart>
      </ResponsiveContainer>
      </ChartSurface>
    </div>
  );
}

export function SentimentTrendChart({ data }) {
  if (!data?.length) return <ChartEmpty message="Need more reviews to show sentiment over time" />;
  const chartHeight = 240;
  return (
    <div style={modalStyles.chartBlock}>
      <h3 style={modalStyles.chartTitle}>Sentiment over time (% per week)</h3>
      <ChartSurface height={chartHeight}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" />
          <XAxis dataKey="week" tickFormatter={formatShortDate} tick={CHART_TICK} />
          <YAxis domain={[0, 100]} tick={CHART_TICK} />
          <Tooltip
            labelFormatter={(l) => `Week of ${l}`}
            formatter={(v) => [`${v}%`, ""]}
            contentStyle={CHART_TOOLTIP}
          />
          <Legend wrapperStyle={CHART_LEGEND} />
          <Area type="monotone" dataKey="positivePct" stackId="1" stroke={CHART_COLORS.positive} fill={CHART_COLORS.positive} name="Positive" />
          <Area type="monotone" dataKey="neutralPct" stackId="1" stroke={CHART_COLORS.neutral} fill={CHART_COLORS.neutral} name="Neutral" />
          <Area type="monotone" dataKey="negativePct" stackId="1" stroke={CHART_COLORS.negative} fill={CHART_COLORS.negative} name="Negative" />
        </AreaChart>
      </ResponsiveContainer>
      </ChartSurface>
    </div>
  );
}

export function KeywordBarChart({ data }) {
  if (!data?.length) return <ChartEmpty message="No negative review themes yet" />;
  const chartHeight = Math.max(160, data.length * 28 + 40);
  return (
    <div style={modalStyles.chartBlock}>
      <h3 style={modalStyles.chartTitle}>Top complaint themes (1 to 2★ reviews)</h3>
      <ChartSurface height={chartHeight}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={CHART_TICK} />
          <YAxis type="category" dataKey="word" tick={CHART_TICK} width={80} />
          <Tooltip formatter={(v) => [v, "Mentions"]} contentStyle={CHART_TOOLTIP} />
          <Bar dataKey="count" fill={CRITICAL_RED} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </ChartSurface>
    </div>
  );
}

export function ProductListTable({ title, items, valueKey = "reviewCount", valueLabel = "Reviews" }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={modalStyles.chartTitle}>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #e1e3e5", fontWeight: 800 }}>Product</th>
            <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e1e3e5", fontWeight: 800 }}>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={`${p.productId}-${p.productName}`}>
              <td style={{ padding: "8px", borderBottom: "1px solid #f1f2f4", fontWeight: 600 }}>{p.productName}</td>
              <td style={{ padding: "8px", borderBottom: "1px solid #f1f2f4", textAlign: "right", fontWeight: 700 }}>
                {valueKey === "avgRating" ? `${p.avgRating}★` : p[valueKey]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

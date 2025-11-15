// frontend/src/BarChart.jsx
import React from "react";

/**
 * Simple SVG BarChart component.
 * Props:
 *  - width, height (numbers)
 *  - labels: array of strings (x-axis labels)
 *  - series: [{ name, color, data: [numbers...] }, ...]
 *
 * Produces vertical grouped bars per label.
 */
export default function BarChart({ width = 760, height = 320, labels = [], series = [] }) {
  // layout margins
  const margin = { top: 18, right: 14, bottom: 36, left: 72 };
  const innerW = Math.max(width - margin.left - margin.right, 10);
  const innerH = Math.max(height - margin.top - margin.bottom, 10);

  const n = labels.length || 0;
  const groupGap = 10; // gap between groups
  const seriesCount = series.length || 0;
  const groupWidth = n > 0 ? (innerW - (n - 1) * groupGap) / n : 0;
  const barGap = 6; // gap between bars in a group
  const barWidth = seriesCount > 0 ? Math.max((groupWidth - (seriesCount - 1) * barGap) / seriesCount, 2) : 0;

  // find max value across series (for y scale)
  const allValues = series.flatMap((s) => (s.data || []));
  const maxValue = Math.max(...allValues, 1);

  // round up max to a "nice" tick step
  const niceMax = (() => {
    const pow = Math.pow(10, Math.floor(Math.log10(maxValue || 1)));
    const digit = Math.ceil((maxValue || 1) / pow);
    const multipliers = [1, 2, 5, 10];
    const m = multipliers.find((mul) => digit <= mul) || 10;
    return m * pow;
  })();

  const ticks = 5;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((niceMax / ticks) * i));

  // helpers
  const formatNum = (v) => {
    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return String(v);
  };

  // map value to y coordinate
  const yFor = (val) => {
    const t = (val / niceMax);
    return margin.top + (1 - t) * innerH;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Bar chart">
      {/* background */}
      <rect x="0" y="0" width={width} height={height} fill="transparent" />

      {/* Y axis labels & grid */}
      <g>
        {tickValues.map((tv, i) => {
          const y = yFor(tv);
          return (
            <g key={`tick-${i}`}>
              <text x={margin.left - 12} y={y + 4} fontSize="12" textAnchor="end" fill="#6b6b6b">{formatNum(tv)}</text>
              <line x1={margin.left} x2={margin.left + innerW} y1={y} y2={y} stroke="#eee" strokeWidth={1} />
            </g>
          );
        })}
      </g>

      {/* x labels and bars */}
      <g transform={`translate(${margin.left},0)`}>{/* shift by left margin */}
        {labels.map((lab, idx) => {
          const groupX = idx * (groupWidth + groupGap);
          return (
            <g key={`group-${idx}`} transform={`translate(${groupX},0)`}>
              {/* bars for this group */}
              {series.map((s, si) => {
                const val = (s.data && s.data[idx]) ? Number(s.data[idx]) : 0;
                const barH = Math.max(0, (val / niceMax) * innerH);
                const x = si * (barWidth + barGap);
                const y = margin.top + (innerH - barH);
                return (
                  <rect key={`bar-${si}`} x={x} y={y} width={barWidth} height={barH}
                    rx="6" ry="6"
                    fill={s.color || "#000"} />
                );
              })}

              {/* x label */}
              <text x={groupWidth / 2} y={margin.top + innerH + 18} fontSize="12" textAnchor="middle" fill="#666">
                {lab}
              </text>
            </g>
          );
        })}
      </g>

      {/* legend (top-right inside chart area) */}
      <g transform={`translate(${margin.left + innerW - 6}, ${margin.top})`}>
        {series.map((s, i) => {
          const y = i * 18;
          return (
            <g key={`legend-${i}`} transform={`translate(-120, ${y})`}>
              <rect x={0} y={-10} width={10} height={10} rx="2" fill={s.color} />
              <text x={14} y={-1} fontSize="12" fill="#444">{s.name}</text>
            </g>
          );
        })}
      </g>

    </svg>
  );
}

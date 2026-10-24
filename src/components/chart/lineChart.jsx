import { useId, useMemo } from "react";

const DEFAULT_COLORS = [
  "#E5E7EB", // White-grey
  "#22D3EE", // Cyan
  "#A3A3A3", // Neutral grey
  "#60A5FA", // Blue
  "#34D399", // Green
  "#C084FC", // Purple
];

const formatNumber = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
      }).format(value)
    : "—";

const getNiceMax = (value) => {
  if (!Number.isFinite(value) || value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  const nice =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;

  return nice * magnitude;
};

export function LineChart({
  data = [],
  height = 260,
  lineColor = "#22D3EE",
  colors = DEFAULT_COLORS,
  valueFormatter = formatNumber,
  showLegend = true,
  showGrid = true,
  showPoints = true,
  showXAxisLabels = true,
  ariaLabel = "Line chart",
  emptyMessage = "No chart data available",
  className = "",
}) {
  const generatedId = useId();

  const chart = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const safeColors =
      Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS;

    const points = safeData
      .filter((item) => {
        if (!item || item.value === null || item.value === "") {
          return false;
        }

        return (
          Number.isFinite(Number(item.value)) &&
          Number.isFinite(Number(item.value))
        );
      })
      .map((item, index) => ({
        label: String(item.label ?? `Point ${index + 1}`),
        value: Number(item.value),
        color: item.color || safeColors[index % safeColors.length] || lineColor,
      }));

    const values = points.map((point) => point.value);

    const minValue = Math.min(0, ...values);
    const rawMax = Math.max(0, ...values);
    const maxValue = getNiceMax(rawMax);

    // Include negative readings while keeping zero visible.
    const lowerBound = minValue < 0 ? -getNiceMax(Math.abs(minValue)) : 0;

    const upperBound = Math.max(maxValue, 1);
    const range = upperBound - lowerBound || 1;

    return {
      points,
      minValue: lowerBound,
      maxValue: upperBound,
      range,
    };
  }, [data, colors, lineColor]);

  const width = 640;
  const safeHeight = Math.max(180, Number(height) || 260);

  const padding = {
    top: 20,
    right: 20,
    bottom: showXAxisLabels ? 44 : 16,
    left: 64,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = safeHeight - padding.top - padding.bottom;

  const getX = (index) =>
    padding.left +
    (chart.points.length <= 1
      ? plotWidth / 2
      : (index / (chart.points.length - 1)) * plotWidth);

  const getY = (value) =>
    padding.top + ((chart.maxValue - value) / chart.range) * plotHeight;

  const coordinates = chart.points.map((point, index) => ({
    ...point,
    x: getX(index),
    y: getY(point.value),
  }));

  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const ticks = Array.from({ length: 5 }, (_, index) => {
    const value = chart.maxValue - (chart.range * index) / 4;

    return {
      value,
      y: getY(value),
    };
  });

  if (!chart.points.length) {
    return (
      <div
        className={`
          flex min-h-48 w-full items-center justify-center
          rounded-xl border border-white/10 bg-black
          px-4 text-center text-sm text-neutral-500
          ${className}
        `}
        role="status"
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 ${className}`}>
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${safeHeight}`}
          className="block h-auto w-full"
          role="img"
          aria-label={ariaLabel}
        >
          {showGrid &&
            ticks.map((tick, index) => (
              <g key={`${generatedId}-grid-${index}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="#262626"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />

                <text
                  x={padding.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  fill="#737373"
                  fontSize="11"
                >
                  {valueFormatter(tick.value)}
                </text>
              </g>
            ))}

          {/* Main line */}
          <path
            d={path}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {showPoints &&
            coordinates.map((point, index) => (
              <g key={`${generatedId}-point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={point.color}
                  stroke="#000000"
                  strokeWidth="2"
                />

                <title>
                  {point.label}: {valueFormatter(point.value)}
                </title>
              </g>
            ))}

          {/* X-axis labels */}
          {showXAxisLabels &&
            coordinates.map((point, index) => (
              <text
                key={`${generatedId}-label-${index}`}
                x={point.x}
                y={safeHeight - 12}
                textAnchor="middle"
                fill="#A3A3A3"
                fontSize="11"
              >
                {point.label.length > 12
                  ? `${point.label.slice(0, 11)}…`
                  : point.label}
              </text>
            ))}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/[0.07] pt-3">
          {coordinates.map((point, index) => (
            <div
              key={`${generatedId}-legend-${index}`}
              className="flex min-w-0 items-center gap-2 text-xs"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: point.color }}
              />

              <span className="max-w-32 truncate text-neutral-400">
                {point.label}
              </span>

              <span className="font-medium tabular-nums text-neutral-200">
                {valueFormatter(point.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LineChart;

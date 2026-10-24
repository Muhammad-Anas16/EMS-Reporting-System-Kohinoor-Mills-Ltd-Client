import { useMemo } from "react";

const DEFAULT_COLOR = "#22D3EE";

export function MiniBarChart({
  values = [],
  color = DEFAULT_COLOR,
  height = 44,
  barCount = 18,
  ariaLabel = "Recent readings",
  className = "",
}) {
  const bars = useMemo(() => {
    const safeValues = Array.isArray(values)
      ? values
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              value !== "" &&
              Number.isFinite(Number(value)),
          )
          .map(Number)
      : [];

    if (!safeValues.length) return [];

    const sampled =
      safeValues.length <= barCount
        ? safeValues
        : Array.from({ length: barCount }, (_, index) => {
            const sourceIndex = Math.round(
              (index * (safeValues.length - 1)) / Math.max(1, barCount - 1),
            );

            return safeValues[sourceIndex];
          });

    const max = Math.max(...sampled.map(Math.abs), 1);
    const minHeight = 3;
    const usableHeight = height - minHeight;

    return sampled.map((value, index) => ({
      value,
      x: (index * 180) / sampled.length + 2,
      width: Math.max(2, 176 / sampled.length - 3),
      barHeight: minHeight + (Math.abs(value) / max) * usableHeight,
    }));
  }, [values, height, barCount]);

  if (!bars.length) {
    return (
      <div
        className={`flex items-center text-[11px] text-neutral-600 ${className}`}
        style={{ height }}
        role="status"
      >
        No readings available
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 ${className}`}>
      <svg
        viewBox={`0 0 180 ${height}`}
        className="block h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <line
          x1="0"
          x2="180"
          y1={height - 1}
          y2={height - 1}
          stroke="#262626"
        />

        {bars.map((bar, index) => (
          <rect
            key={`${index}-${bar.value}`}
            x={bar.x}
            y={height - bar.barHeight}
            width={bar.width}
            height={bar.barHeight}
            rx="1.5"
            fill={color}
            opacity={0.4 + (index / Math.max(1, bars.length - 1)) * 0.6}
          >
            <title>{String(bar.value)}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

export default MiniBarChart;

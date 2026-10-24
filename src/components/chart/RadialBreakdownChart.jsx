import { useMemo } from "react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

const DEFAULT_COLORS = [
  "#22D3EE",
  "#E5E7EB",
  "#A3A3A3",
  "#60A5FA",
  "#34D399",
  "#C084FC",
];

const formatNumber = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
      }).format(value)
    : "—";

export function RadialBreakdownChart({
  data = [],
  total,
  centerLabel = "Total",
  valueFormatter = formatNumber,
  colors = DEFAULT_COLORS,
  height = 240,
  emptyMessage = "No breakdown data available",
  ariaLabel = "Radial breakdown chart",
  className = "",
}) {
  const chartData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const safeColors =
      Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS;

    const validItems = safeData
      .filter(
        (item) =>
          item &&
          item.value !== null &&
          item.value !== undefined &&
          item.value !== "" &&
          Number.isFinite(Number(item.value)) &&
          Number(item.value) >= 0,
      )
      .map((item, index) => ({
        name: String(item.name ?? `Item ${index + 1}`),
        value: Number(item.value),
        fill: item.color || safeColors[index % safeColors.length],
      }));

    const sum = validItems.reduce((acc, item) => acc + item.value, 0);

    return {
      items: validItems.map((item) => ({
        ...item,
        share: sum > 0 ? (item.value / sum) * 100 : 0,
      })),
      sum,
    };
  }, [data, colors]);

  const displayTotal = Number.isFinite(total) ? total : chartData.sum;

  if (!chartData.items.length || chartData.sum <= 0) {
    return (
      <div
        className={`flex min-h-48 items-center justify-center rounded-xl border border-white/10 bg-black px-4 text-center text-sm text-neutral-500 ${className}`}
        role="status"
      >
        {emptyMessage}
      </div>
    );
  }

  // Each division gets its own radial track.
  // Values are percentages, so each ring is scaled to 100%.
  const radialData = chartData.items.map((item) => ({
    ...item,
    track: 100,
  }));

  return (
    <div className={`w-full min-w-0 ${className}`}>
      <div className="mx-auto w-full" style={{ maxWidth: height }}>
        <RadialBarChart
          width={height}
          height={height}
          data={radialData}
          cx="50%"
          cy="50%"
          innerRadius="24%"
          outerRadius="92%"
          startAngle={90}
          endAngle={-270}
          barSize={Math.max(5, Math.min(13, 48 / radialData.length))}
          barGap={3}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            polarRadius={["92%"]}
            className="[&>circle]:fill-white/[0.025]"
          />

          <RadialBar
            dataKey="share"
            background={{
              fill: "#262626",
            }}
            cornerRadius={4}
            isAnimationActive={false}
          />

          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            tickLine={false}
            axisLine={false}
          >
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                  return null;
                }

                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      dy="-5"
                      fill="#FFFFFF"
                      fontSize="19"
                      fontWeight="600"
                    >
                      {valueFormatter(displayTotal)}
                    </tspan>

                    <tspan x={viewBox.cx} dy="20" fill="#737373" fontSize="10">
                      {centerLabel}
                    </tspan>
                  </text>
                );
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </div>

      <p className="mt-1 text-center text-[10px] text-neutral-600">
        Each ring represents a division's share of the total.
      </p>

      <div className="mt-4 space-y-3">
        {chartData.items.map((item) => (
          <div
            key={item.name}
            className="flex min-w-0 items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />

              <span className="truncate text-xs text-neutral-400">
                {item.name}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs tabular-nums text-neutral-200">
                {valueFormatter(item.value)}
              </span>

              <span className="w-12 text-right text-xs tabular-nums text-neutral-500">
                {item.share.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RadialBreakdownChart;

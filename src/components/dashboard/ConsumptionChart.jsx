import { useMemo } from "react";
import { ChartNoAxesCombined, Info } from "lucide-react";

import { Panel } from "@/components/dashboard/Panel";
import LineChart from "@/components/chart/lineChart";

const COLORS = [
  "#E5E7EB", // White-grey
  "#22D3EE", // Cyan
  "#A3A3A3", // Neutral grey
  "#60A5FA", // Blue
  "#34D399", // Green
  "#C084FC", // Purple
];

const fmt = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
      }).format(value)
    : "—";

export function ConsumptionChart({ divisions = [] }) {
  const safeDivisions = Array.isArray(divisions) ? divisions : [];

  const chartData = useMemo(
    () =>
      safeDivisions
        .filter((division) => division?.summary)
        .map((division, index) => {
          const rawValue = division.summary.totalPower;

          const value =
            rawValue !== null &&
            rawValue !== undefined &&
            rawValue !== "" &&
            Number.isFinite(Number(rawValue))
              ? Number(rawValue)
              : null;

          return {
            label: division.name || division.key || `Division ${index + 1}`,
            value,
            color: COLORS[index % COLORS.length],
          };
        })
        .filter((division) => division.value !== null),
    [safeDivisions],
  );

  const totalPower = useMemo(
    () => chartData.reduce((sum, division) => sum + division.value, 0),
    [chartData],
  );

  return (
    <Panel
      title="Power Reading by Division"
      subtitle="Current readings · not historical trend data"
      icon={ChartNoAxesCombined}
      className="h-full min-w-0"
    >
      <div className="min-w-0 p-4 sm:p-5 lg:p-6 bg-[#0A0A0A]">
        {/* Summary */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500 sm:text-sm">
              Combined power readings
            </p>

            <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
              {chartData.length ? fmt(totalPower) : "—"}
            </p>

            <p className="mt-1 text-xs text-neutral-600">
              {chartData.length}{" "}
              {chartData.length === 1 ? "division" : "divisions"} available
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Current snapshot
          </span>
        </div>

        {/* Chart */}
        <div className="min-w-0">
          <LineChart
            data={chartData}
            height={260}
            lineColor="#22D3EE"
            colors={COLORS}
            valueFormatter={fmt}
            showLegend
            showGrid
            showPoints
            showXAxisLabels
            ariaLabel="Current power readings by division"
            emptyMessage="No division power readings available"
          />
        </div>

        {/* Information */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-black p-3 sm:p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-300">
              About this chart
            </p>

            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              This chart compares the current power readings available for each
              division. Historical trends require timestamped energy log data;
              this component does not generate past readings.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default ConsumptionChart;

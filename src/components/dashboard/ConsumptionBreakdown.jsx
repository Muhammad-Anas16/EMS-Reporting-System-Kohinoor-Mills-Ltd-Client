import { useMemo } from "react";
import { ChartNoAxesCombined } from "lucide-react";

import PieChartLabelList from "@/components/chart/PieChartLabelList";
import { Panel } from "./Panel";

const COLORS = [
  "#22D3EE",
  "#F59E0B",
  "#34D399",
  "#60A5FA",
  "#A78BFA",
  "#FB7185",
  "#F97316",
  "#E5E7EB",
];

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);

const getNumericValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const ConsumptionBreakdown = ({ divisions = [] }) => {
  const items = useMemo(() => {
    if (!Array.isArray(divisions)) return [];

    return divisions.map((division, index) => {
      const value = getNumericValue(division?.summary?.totalPower);

      return {
        name:
          division?.name ||
          division?.divisionName ||
          division?.key ||
          `Division ${index + 1}`,
        value: value !== null && value > 0 ? value : 0,
        color: COLORS[index % COLORS.length],
      };
    });
  }, [divisions]);

  // console.log("items : ", items);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.value, 0),
    [items],
  );

  // console.log("total : ", total);

  const chartItems = useMemo(
    () => items.filter((item) => item.value > 0),
    [items],
  );

  return (
    <Panel>
      <div className="space-y-4 p-4 sm:p-5 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <ChartNoAxesCombined className="h-5 w-5 text-cyan-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white">
              Division Power Mix
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Power distribution across all divisions
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs text-neutral-500">Combined power reading</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {formatNumber(total)}
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-400">
            {items.length} divisions
          </span>
        </div>

        <PieChartLabelList
          data={chartItems}
          dataKey="value"
          nameKey="name"
          colors={COLORS}
          height={270}
          valueFormatter={formatNumber}
          ariaLabel="Power distribution across all divisions"
          emptyMessage="No positive power readings available"
        />

        <div className="space-y-2 border-t border-white/10 pt-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-neutral-400">{item.name}</span>
              </div>

              <span className="shrink-0 font-medium text-white">
                {formatNumber(item.value)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs leading-5 text-neutral-500">
          Each slice represents a division's share of its available power
          reading. All readings must use the same unit.
        </p>
      </div>
    </Panel>
  );
};

export default ConsumptionBreakdown;

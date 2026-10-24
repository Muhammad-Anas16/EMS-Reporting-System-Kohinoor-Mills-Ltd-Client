import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Droplets, Gauge, Waves, Zap } from "lucide-react";

import { Panel } from "@/components/dashboard/Panel";
import { MiniBarChart } from "@/components/chart/MiniBarChart";

const utilities = [
  {
    key: "power",
    label: "Power",
    icon: Zap,
    unit: "Configured units",
    color: "#22D3EE",
    tone: "text-cyan-300",
  },
  {
    key: "kwh",
    label: "Energy",
    icon: Gauge,
    unit: "kWh counter",
    color: "#60A5FA",
    tone: "text-blue-300",
  },
  {
    key: "amp",
    label: "Current",
    icon: Waves,
    unit: "Amperes · verify scale",
    color: "#C084FC",
    tone: "text-purple-300",
  },
  {
    key: "status",
    label: "Status readings",
    icon: Droplets,
    unit: "Valid readings",
    color: "#34D399",
    tone: "text-emerald-300",
  },
];

const getNumericValue = (meter, field) => {
  const value = meter?.readings?.[field]?.liveValue;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const fmt = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(value)
    : "—";

export function UtilityCards({ meters = [] }) {
  const shouldReduceMotion = useReducedMotion();

  const safeMeters = Array.isArray(meters) ? meters : [];

  const summaries = useMemo(
    () =>
      utilities.map((utility) => {
        const readings = safeMeters
          .map((meter) => getNumericValue(meter, utility.key))
          .filter((value) => value !== null);

        const isStatus = utility.key === "status";

        return {
          ...utility,
          readings,
          count: readings.length,
          total: isStatus
            ? readings.length
            : readings.reduce((sum, value) => sum + value, 0),
          hasData: readings.length > 0,
        };
      }),
    [safeMeters],
  );

  return (
    <Panel
      title="Live Meter Summary"
      subtitle="Aggregated configured BACnet readings"
      icon={Zap}
      className="h-full min-w-0"
    >
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4">
        {summaries.map((utility, index) => {
          const Icon = utility.icon;

          return (
            <motion.article
              key={utility.key}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                delay: shouldReduceMotion ? 0 : index * 0.04,
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              className="
                flex min-w-0 flex-col rounded-xl
                border border-white/10 bg-[#0A0A0A]
                p-4 transition-colors duration-200
                hover:border-white/20
              "
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`
                    grid h-10 w-10 shrink-0 place-items-center
                    rounded-xl border border-white/10
                    bg-white/[0.03] ${utility.tone}
                  `}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span className="text-right text-[10px] leading-4 text-neutral-500">
                  {utility.unit}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-neutral-400">
                {utility.label}
              </p>

              <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
                {utility.hasData ? fmt(utility.total) : "—"}
              </p>

              <p className="mt-1 text-[11px] text-neutral-600">
                {utility.hasData
                  ? `${utility.count} valid ${
                      utility.count === 1 ? "reading" : "readings"
                    }`
                  : "No valid readings"}
              </p>

              <div className="mt-4 border-t border-white/[0.07] pt-3">
                <MiniBarChart
                  values={utility.readings}
                  color={utility.color}
                  height={42}
                  ariaLabel={`${utility.label} readings across configured meters`}
                />
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <p className="rounded-lg border border-white/[0.07] bg-black p-3 text-[11px] leading-relaxed text-neutral-500">
          Values are aggregated from configured live readings. Confirm the
          BACnet point mapping and units before treating these totals as actual
          utility consumption. Status displays a reading count, not a sum of raw
          status codes.
        </p>
      </div>
    </Panel>
  );
}

export default UtilityCards;

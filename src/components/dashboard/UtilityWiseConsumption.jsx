import { useMemo } from "react";
import { Activity, Gauge, Zap, Wifi } from "lucide-react";
import { summarizeMeters } from "@/services/bacnetService";

const formatValue = (value) => {
  const numericValue = Number(value);

  return value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(numericValue)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(numericValue)
    : "—";
};

const UtilityWiseConsumption = ({ meters = [] }) => {
  const summary = useMemo(
    () => summarizeMeters(Array.isArray(meters) ? meters : []),
    [meters],
  );

  const kpis = [
    {
      label: "Total Power",
      value: formatValue(summary.totalPower),
      description: "Combined power readings",
      icon: Zap,
    },
    {
      label: "Total Energy",
      value: formatValue(summary.totalKwh),
      description: "Combined kWh readings",
      icon: Gauge,
    },
    {
      label: "Total Current",
      value: formatValue(summary.totalAmp),
      description: "Combined current readings",
      icon: Activity,
    },
    {
      label: "Reporting Meters",
      value: `${formatValue(summary.onlineMeters)} / ${formatValue(summary.meterCount)}`,
      description: `${formatValue(summary.unavailableMeters)} without a positive status reading`,
      icon: Wifi,
    },
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-white">
          Utility Consumption & Combined KPIs
        </h2>

        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Combined readings from configured meters. Verify meter units and
          utility mapping before treating these as operational totals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
        {kpis.map(({ label, value, description, icon: Icon }) => (
          <article
            key={label}
            className="min-w-0 rounded-lg border border-white/10 bg-[#0A0A0A] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-neutral-400">{label}</p>

              <Icon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-cyan-300"
              />
            </div>

            <p className="mt-3 break-words text-2xl font-semibold tabular-nums text-white">
              {value}
            </p>

            <p className="mt-2 text-[11px] leading-4 text-neutral-500">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default UtilityWiseConsumption;

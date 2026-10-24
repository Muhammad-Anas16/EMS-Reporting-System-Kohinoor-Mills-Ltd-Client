import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Droplets,
  Flame,
  Gauge,
  Radio,
  Waves,
  Zap,
  ArrowUpRight,
} from "lucide-react";

import { Panel } from "@/components/dashboard/Panel";

const UTILITIES = [
  {
    key: "power",
    label: "Electrical Power",
    unit: "Configured meter units",
    source: "power",
    icon: Zap,
    color: "cyan",
    mapped: true,
    description: "Live power readings reported by electrical meters.",
  },
  {
    key: "energy",
    label: "Electrical Energy",
    unit: "kWh counter",
    source: "kwh",
    icon: Gauge,
    color: "blue",
    mapped: true,
    description: "Reported energy counter values from mapped meters.",
  },
  {
    key: "current",
    label: "Electrical Current",
    unit: "Configured current units",
    source: "amp",
    icon: Activity,
    color: "violet",
    mapped: true,
    description:
      "Reported current readings. Verify BACnet scaling and units before interpreting them as amperes.",
  },
  {
    key: "water",
    label: "Water Consumption",
    unit: "Flow / volume units required",
    source: null,
    icon: Droplets,
    color: "sky",
    mapped: false,
    description:
      "A dedicated water flow or volume reading is not mapped in the current meter schema.",
  },
  {
    key: "steam",
    label: "Steam Consumption",
    unit: "Mass / flow units required",
    source: null,
    icon: Waves,
    color: "amber",
    mapped: false,
    description: "A dedicated steam flow or mass reading has not been mapped.",
  },
  {
    key: "gas",
    label: "Gas Consumption",
    unit: "Volume / energy units required",
    source: null,
    icon: Flame,
    color: "orange",
    mapped: false,
    description:
      "A dedicated gas flow, volume or energy reading has not been mapped.",
  },
];

const COLOR_STYLES = {
  cyan: {
    icon: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    glow: "from-cyan-400/[0.10]",
    accent: "bg-cyan-400",
    text: "text-cyan-300",
  },
  blue: {
    icon: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    glow: "from-blue-400/[0.10]",
    accent: "bg-blue-400",
    text: "text-blue-300",
  },
  violet: {
    icon: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    glow: "from-violet-400/[0.10]",
    accent: "bg-violet-400",
    text: "text-violet-300",
  },
  sky: {
    icon: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    glow: "from-sky-400/[0.10]",
    accent: "bg-sky-400",
    text: "text-sky-300",
  },
  amber: {
    icon: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    glow: "from-amber-400/[0.10]",
    accent: "bg-amber-400",
    text: "text-amber-300",
  },
  orange: {
    icon: "border-orange-400/20 bg-orange-400/10 text-orange-300",
    glow: "from-orange-400/[0.10]",
    accent: "bg-orange-400",
    text: "text-orange-300",
  },
};

const OVERVIEW_STYLES = {
  cyan: "border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300",
  emerald: "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300",
  blue: "border-blue-400/15 bg-blue-400/[0.05] text-blue-300",
  violet: "border-violet-400/15 bg-violet-400/[0.05] text-violet-300",
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);

const isValidNumber = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const getLiveReading = (meter, source) => {
  if (!source) return null;

  const nestedValue = meter?.readings?.[source]?.liveValue;

  if (isValidNumber(nestedValue)) {
    return Number(nestedValue);
  }

  const liveValue = meter?.live?.[source];

  if (isValidNumber(liveValue)) {
    return Number(liveValue);
  }

  return null;
};

const StatusBadge = ({ available, mapped }) => {
  if (!mapped) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1 text-[10px] font-medium text-amber-300">
        <CircleAlert className="h-3 w-3" />
        Not mapped
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        available
          ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
          : "border-neutral-700 bg-white/[0.025] text-neutral-500"
      }`}
    >
      {available ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <CircleAlert className="h-3 w-3" />
      )}
      {available ? "Reporting" : "No readings"}
    </span>
  );
};

const OverviewCard = ({ label, value, detail, icon: Icon, color }) => (
  <article className="relative min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b111b] p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-neutral-500">{label}</p>
        <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>
      </div>

      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${OVERVIEW_STYLES[color]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>

    <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">
      {detail}
    </p>
  </article>
);

const DivisionUtilityGrid = ({ meters = [] }) => {
  const navigate = useNavigate();
  const { division } = useParams();

  const safeMeters = Array.isArray(meters) ? meters : [];

  const utilityData = useMemo(
    () =>
      UTILITIES.map((utility) => {
        if (!utility.mapped) {
          return {
            ...utility,
            count: 0,
            total: null,
            average: null,
            coverage: 0,
          };
        }

        const values = safeMeters
          .map((meter) => getLiveReading(meter, utility.source))
          .filter((value) => value !== null);

        const total = values.reduce((sum, value) => sum + value, 0);

        return {
          ...utility,
          count: values.length,
          total: values.length ? total : null,
          average: values.length ? total / values.length : null,
          coverage: safeMeters.length
            ? (values.length / safeMeters.length) * 100
            : 0,
        };
      }),
    [safeMeters],
  );

  const overview = useMemo(() => {
    const electrical = utilityData.filter((item) => item.mapped);

    const totalReadings = electrical.reduce((sum, item) => sum + item.count, 0);

    const expectedReadings = safeMeters.length * electrical.length;

    const reportingMeters = new Set();

    safeMeters.forEach((meter, index) => {
      if (
        electrical.some((item) => getLiveReading(meter, item.source) !== null)
      ) {
        reportingMeters.add(meter?.meter_key || index);
      }
    });

    return {
      totalMeters: safeMeters.length,
      reportingMeters: reportingMeters.size,
      totalReadings,
      coverage: expectedReadings ? (totalReadings / expectedReadings) * 100 : 0,
    };
  }, [safeMeters, utilityData]);

  const openUtilityMeters = (utility) => {
    if (!utility.mapped) return;

    const divisionPath = division ? `/${encodeURIComponent(division)}` : "";

    navigate(`${divisionPath}/meters?utility=${utility.key}`);
  };

  return (
    <Panel
      title="Utilities & Resource Monitoring"
      subtitle="Live electrical monitoring and utility measurement coverage"
      icon={Waves}
      className="border-white/[0.09] bg-[#080d14]"
    >
      <div className="space-y-5 p-3 sm:p-5">
        {/* Overview */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            label="Registered Meters"
            value={formatNumber(overview.totalMeters)}
            detail="Meters received by this division"
            icon={Gauge}
            color="cyan"
          />

          <OverviewCard
            label="Reporting Meters"
            value={formatNumber(overview.reportingMeters)}
            detail={`Out of ${formatNumber(overview.totalMeters)} meters`}
            icon={Radio}
            color="emerald"
          />

          <OverviewCard
            label="Valid Readings"
            value={formatNumber(overview.totalReadings)}
            detail="Across mapped electrical metrics"
            icon={Activity}
            color="blue"
          />

          <OverviewCard
            label="Reading Coverage"
            value={`${formatNumber(overview.coverage)}%`}
            detail="Valid readings divided by expected readings"
            icon={Zap}
            color="violet"
          />
        </div>

        {/* Electrical summary */}
        <section>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Electrical Overview
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Aggregated from actual meter readings
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {utilityData
              .filter((item) => item.mapped)
              .map((item) => {
                const Icon = item.icon;
                const styles = COLOR_STYLES[item.color];
                const value =
                  item.key === "current" ? item.average : item.total;

                return (
                  <article
                    key={item.key}
                    className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b111b] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-400">
                          {item.key === "current"
                            ? "Average Current Reading"
                            : item.key === "energy"
                              ? "Combined Energy Counters"
                              : "Total Power Reading"}
                        </p>

                        <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-white">
                          {value === null ? "—" : formatNumber(value)}
                        </p>

                        <p className="mt-1 text-[10px] text-neutral-500">
                          {item.unit}
                        </p>
                      </div>

                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${styles.icon}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 border-t border-white/[0.06] pt-3 text-[10px] text-neutral-500">
                      <Radio className={`h-3 w-3 ${styles.text}`} />
                      {item.count} meters reporting
                    </div>
                  </article>
                );
              })}
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-neutral-600">
            Values use actual reported readings. Verify engineering units,
            BACnet scaling and energy-counter semantics before using totals for
            billing or engineering decisions.
          </p>
        </section>

        {/* Clickable utility cards */}
        <section>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Utility Measurement Coverage
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Select an electrical utility to view its corresponding meters
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {utilityData.map((item) => {
              const Icon = item.icon;
              const styles = COLOR_STYLES[item.color];
              const available = item.mapped && item.count > 0;

              return (
                <article
                  key={item.key}
                  role={item.mapped ? "button" : undefined}
                  tabIndex={item.mapped ? 0 : undefined}
                  aria-disabled={!item.mapped}
                  onClick={() => openUtilityMeters(item)}
                  onKeyDown={(event) => {
                    if (
                      item.mapped &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      openUtilityMeters(item);
                    }
                  }}
                  className={`group relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b111b] p-4 transition-all duration-300 sm:p-5 ${
                    item.mapped
                      ? "cursor-pointer hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-[#0d1521] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                      : "cursor-not-allowed opacity-75"
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.glow} via-transparent to-transparent opacity-70`}
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`grid h-11 w-11 place-items-center rounded-xl border ${styles.icon} transition-transform duration-300 ${
                          item.mapped ? "group-hover:scale-105" : ""
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <StatusBadge available={available} mapped={item.mapped} />
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-neutral-400">
                          {item.label}
                        </p>

                        {item.mapped && (
                          <ArrowUpRight
                            className={`h-4 w-4 text-neutral-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${styles.text}`}
                          />
                        )}
                      </div>

                      <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {item.key === "current"
                          ? item.average === null
                            ? "—"
                            : formatNumber(item.average)
                          : item.total === null
                            ? "—"
                            : formatNumber(item.total)}
                      </p>

                      <p className="mt-1 text-[11px] text-neutral-500">
                        {item.unit}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-white/[0.07] pt-4">
                      {item.mapped ? (
                        <>
                          <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-neutral-500">
                              Meter coverage
                            </span>
                            <span className={styles.text}>
                              {item.count} / {safeMeters.length}
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full ${styles.accent} transition-[width] duration-500`}
                              style={{ width: `${item.coverage}%` }}
                            />
                          </div>

                          <p className="mt-3 min-h-8 text-[11px] leading-relaxed text-neutral-500">
                            {item.count === 0
                              ? "No valid readings are currently available for this metric."
                              : `${item.count} of ${safeMeters.length} meters report a valid ${item.label.toLowerCase()} reading.`}
                          </p>

                          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 transition-colors group-hover:text-cyan-300">
                            View related meters
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </p>
                        </>
                      ) : (
                        <p className="min-h-8 text-[11px] leading-relaxed text-neutral-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-amber-400/10 bg-amber-400/[0.035] px-3.5 py-3">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-[10px] leading-relaxed text-neutral-400">
            Water, steam and gas are not clickable because their dedicated
            BACnet measurement points are not mapped yet. Zero is treated as a
            valid reading. Current is averaged rather than summed.
          </p>
        </div>
      </div>
    </Panel>
  );
};

export default DivisionUtilityGrid;

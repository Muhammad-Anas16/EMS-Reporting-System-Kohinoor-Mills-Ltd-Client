import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Droplets,
  Flame,
  Gauge,
  Wind,
  Waves,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { useParams } from "react-router";

const isValidNumber = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const getReading = (meter, fields) => {
  for (const field of fields) {
    const nestedValue = meter?.readings?.[field]?.liveValue;

    if (isValidNumber(nestedValue)) {
      return Number(nestedValue);
    }

    const liveValue = meter?.live?.[field];

    if (isValidNumber(liveValue)) {
      return Number(liveValue);
    }
  }

  return null;
};

const formatNumber = (value) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(value);

const UTILITIES = [
  {
    key: "electricity",
    label: "Electricity",
    fields: ["power"],
    unit: "Configured power units",
    icon: Zap,
    color: "text-cyan-300",
  },
  {
    key: "water",
    label: "Water",
    fields: ["water", "waterFlow", "waterConsumption", "waterVolume"],
    unit: "Configured flow / volume units",
    icon: Droplets,
    color: "text-sky-300",
  },
  {
    key: "gas",
    label: "Gas",
    fields: ["gas", "gasFlow", "gasConsumption", "gasVolume"],
    unit: "Configured volume / energy units",
    icon: Flame,
    color: "text-orange-300",
  },
  {
    key: "steam",
    label: "Steam",
    fields: ["steam", "steamFlow", "steamConsumption", "steamMassFlow"],
    unit: "Configured flow / mass units",
    icon: Waves,
    color: "text-amber-300",
  },
  {
    key: "air",
    label: "Air",
    fields: ["air", "airFlow", "compressedAir", "airConsumption"],
    unit: "Configured flow units",
    icon: Wind,
    color: "text-violet-300",
  },
];

const DivisionUtilityStatus = ({ meters = [] }) => {
  const { division } = useParams();

  const safeMeters = Array.isArray(meters) ? meters : [];

  const utilityData = useMemo(
    () =>
      UTILITIES.map((utility) => {
        const readings = safeMeters
          .map((meter) => getReading(meter, utility.fields))
          .filter((value) => value !== null);

        return {
          ...utility,
          total: readings.length
            ? readings.reduce((sum, value) => sum + value, 0)
            : null,
          count: readings.length,
        };
      }),
    [safeMeters],
  );

  const demandAndAlarm = useMemo(() => {
    const demandFields = ["demand", "powerDemand", "kwDemand", "maxDemand"];

    const alarmFields = ["alarm", "alarmStatus", "activeAlarm", "alarmCount"];

    const demandReadings = safeMeters
      .map((meter) => getReading(meter, demandFields))
      .filter((value) => value !== null);

    const alarmReadings = safeMeters
      .map((meter) => getReading(meter, alarmFields))
      .filter((value) => value !== null);

    return {
      demandTotal: demandReadings.length
        ? demandReadings.reduce((sum, value) => sum + value, 0)
        : null,
      demandCount: demandReadings.length,
      alarmCount: alarmReadings.length
        ? alarmReadings.filter((value) => value > 0).length
        : null,
      alarmReadings: alarmReadings.length,
    };
  }, [safeMeters]);

  const sldHref = `/${encodeURIComponent(division || "dyeing")}#division-sld`;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            Utility Readings Verification
          </h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Readings are taken only from recognised live meter fields. Missing
            utility mappings are shown explicitly.
          </p>
        </div>

        <a
          href={sldHref}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/[0.12]"
        >
          <Activity className="h-4 w-4" />
          View Electrical SLD
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {utilityData.map((utility) => {
          const Icon = utility.icon;
          const isMapped = utility.count > 0;

          return (
            <article
              key={utility.key}
              className="min-w-0 rounded-xl border border-white/10 bg-neutral-950 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${utility.color}`} />
                  <h3 className="truncate text-sm font-medium text-white">
                    {utility.label}
                  </h3>
                </div>

                {isMapped ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-300"
                    aria-label="Readings available"
                  />
                ) : (
                  <CircleHelp
                    className="h-4 w-4 shrink-0 text-amber-300"
                    aria-label="Not mapped"
                  />
                )}
              </div>

              <p className="mt-4 break-words text-2xl font-semibold tabular-nums text-white">
                {formatNumber(utility.total)}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-neutral-500">
                {utility.unit}
              </p>

              <div className="mt-3 border-t border-white/[0.07] pt-3">
                <span
                  className={`text-[11px] ${
                    isMapped ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {isMapped
                    ? `${utility.count} meters with readings`
                    : "Not mapped / no readings"}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-neutral-950 p-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-semibold text-white">Demand Status</h3>
          </div>

          <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
            {formatNumber(demandAndAlarm.demandTotal)}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            {demandAndAlarm.demandCount > 0
              ? `${demandAndAlarm.demandCount} meters reporting demand`
              : "Demand point not configured or no readings available"}
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-neutral-950 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-4 w-4 ${
                demandAndAlarm.alarmCount > 0
                  ? "text-red-300"
                  : "text-amber-300"
              }`}
            />
            <h3 className="text-sm font-semibold text-white">Alarm Status</h3>
          </div>

          <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
            {demandAndAlarm.alarmCount === null
              ? "—"
              : demandAndAlarm.alarmCount}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            {demandAndAlarm.alarmReadings > 0
              ? `${demandAndAlarm.alarmReadings} meters have alarm readings`
              : "Alarm point not configured or no readings available"}
          </p>
        </article>
      </div>
    </section>
  );
};

export default DivisionUtilityStatus;

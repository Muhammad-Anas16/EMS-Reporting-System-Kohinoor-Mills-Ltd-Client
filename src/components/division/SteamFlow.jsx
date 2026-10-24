import { useMemo } from "react";
import { useLocation } from "react-router";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Flame,
  Gauge,
  Waves,
} from "lucide-react";

const FLOW_FIELDS = [
  "steamFlow",
  "steam_flow",
  "steamFlowRate",
  "steam_flow_rate",
  "flowRate",
  "flow_rate",
  "flow",
  "tonPerHour",
  "tonsPerHour",
  "tph",
];

const SUPPLY_KEYS = [
  "totalSteamMain",
  "total_steam_main",
  "mainSteamFlow",
  "main_steam_flow",
  "totalMainFlow",
];

const TOTAL_SUPPLY_KEYS = [
  "totalSteamSupply",
  "total_steam_supply",
  "totalSupply",
  "total_supply",
];

const TOTAL_DISTRIBUTION_KEYS = [
  "totalSubDistribution",
  "total_sub_distribution",
  "totalDistribution",
  "total_distribution",
];

const CONSUMER_NAMES = [
  "HFO",
  "Curing",
  "New Mercerizing",
  "Singeing 02 Recipe",
  "Jigger No.2",
  "Pad Steam No.1 Steamer",
  "Pad Steam No.3",
  "Color Kitchen Lab",
  "Old Bleaching",
  "New Bleaching",
  "Singeing 01",
  "Jigger No.1",
  "Pad Steam No.1",
  "Pad Steam No.2",
  "Quality Lab",
  "Topassa Dryer",
];

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
};

const formatFlow = (value) =>
  `${(toNumber(value) ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} t/h`;

const getExplicitFlow = (item) => {
  if (!item || typeof item !== "object") return null;

  for (const field of FLOW_FIELDS) {
    const directValue = toNumber(item[field]);

    if (directValue !== null) return directValue;
  }

  const readings = item.readings;

  if (readings && typeof readings === "object") {
    for (const field of FLOW_FIELDS) {
      const reading = readings[field];

      if (reading && typeof reading === "object") {
        const value =
          toNumber(reading.liveValue) ??
          toNumber(reading.value) ??
          toNumber(reading.currentValue);

        if (value !== null) return value;
      } else {
        const value = toNumber(reading);

        if (value !== null) return value;
      }
    }
  }

  return null;
};

const findNamedPoint = (items, aliases) => {
  if (!Array.isArray(items)) return null;

  const normalizedAliases = aliases.map(normalize);

  return (
    items.find((item) => {
      const identity = normalize(
        item?.meter_name ??
          item?.name ??
          item?.label ??
          item?.point_name ??
          item?.displayName ??
          item?.tag_name ??
          "",
      );

      return (
        identity &&
        normalizedAliases.some(
          (alias) =>
            identity === alias ||
            identity.includes(alias) ||
            alias.includes(identity),
        )
      );
    }) ?? null
  );
};

const findTotal = (source, keys) => {
  if (!source || typeof source !== "object") return null;

  for (const key of keys) {
    const value = toNumber(source[key]);

    if (value !== null) return value;
  }

  return null;
};

const getDivisionName = (pathname) => {
  const lastSegment = pathname.split("/").filter(Boolean).pop();

  return lastSegment || "dyeing";
};

const SummaryItem = ({ label, value, icon: Icon, tone = "cyan" }) => {
  const tones = {
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    rose: "text-rose-300",
  };

  return (
    <div className="min-w-0 rounded-lg border border-white/[0.08] bg-transparent px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon size={14} className={tones[tone]} />
        <span>{label}</span>
      </div>

      <div className={`mt-1 text-lg font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
};

const StatusDot = ({ active }) => (
  <span
    className={`relative flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${
      active
        ? "border-cyan-300 bg-cyan-400/20"
        : "border-slate-500 bg-slate-700"
    }`}
    title={active ? "Flow reading available" : "No flow reading"}
  >
    {active && <span className="h-1 w-1 rounded-full bg-cyan-300" />}
  </span>
);

const BoilerNode = ({ title, subtitle }) => (
  <div className="relative z-10 flex min-w-0 items-center gap-3 rounded-lg border border-amber-400/20 bg-transparent px-3 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-amber-300">
      <Flame size={19} />
    </div>

    <div className="min-w-0">
      <div className="truncate text-sm font-semibold text-slate-100">
        {title}
      </div>

      <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>
    </div>
  </div>
);

const ConsumerNode = ({ name, value, hasReading }) => (
  <div className="group relative flex min-w-0 items-center gap-2 border-b border-white/[0.07] px-2.5 py-2 transition-colors hover:bg-cyan-400/[0.04]">
    <StatusDot active={hasReading} />

    <span
      className="min-w-0 flex-1 truncate text-xs font-medium text-slate-300"
      title={name}
    >
      {name}
    </span>

    <span
      className={`shrink-0 font-mono text-xs ${
        hasReading ? "text-cyan-300" : "text-slate-500"
      }`}
    >
      {formatFlow(value)}
    </span>
  </div>
);

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
    <span className="h-px flex-1 bg-white/[0.08]" />
    {children}
    <span className="h-px flex-1 bg-white/[0.08]" />
  </div>
);

const SteamFlow = ({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
}) => {
  const location = useLocation();

  const resolved = useMemo(() => {
    const division = getDivisionName(location.pathname);

    const divisionData =
      data && !Array.isArray(data) && typeof data === "object"
        ? (data[division] ?? data.dyeing ?? [])
        : data;

    const meters = Array.isArray(divisionData)
      ? divisionData
      : Array.isArray(divisionData?.meters)
        ? divisionData.meters
        : Array.isArray(divisionData?.points)
          ? divisionData.points
          : [];

    const mainMeter = findNamedPoint(meters, [
      "Dyeing Main Steam Flow Meter",
      "Main Steam Flow Meter",
      "Steam Main Meter",
      "Main Steam",
    ]);

    const mainTotal = findTotal(divisionData, SUPPLY_KEYS);
    const mainMeterFlow = getExplicitFlow(mainMeter);

    const mainFlow = mainTotal ?? mainMeterFlow ?? 0;

    const totalSupply = findTotal(divisionData, TOTAL_SUPPLY_KEYS) ?? mainFlow;

    const consumers = CONSUMER_NAMES.map((name) => {
      const meter = findNamedPoint(meters, [name]);
      const value = getExplicitFlow(meter);

      return {
        key: normalize(name),
        name,
        value: value ?? 0,
        hasReading: value !== null,
      };
    });

    const measuredDistribution = consumers.reduce(
      (sum, consumer) => sum + consumer.value,
      0,
    );

    const explicitDistribution = findTotal(
      divisionData,
      TOTAL_DISTRIBUTION_KEYS,
    );

    const distribution = explicitDistribution ?? measuredDistribution;

    return {
      division,
      mainFlow,
      totalSupply,
      distribution,
      losses: Math.max(0, totalSupply - distribution),
      consumers,
      hasMainReading: mainTotal !== null || mainMeterFlow !== null,
    };
  }, [data, location.pathname]);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-white/10 bg-transparent p-6 text-sm text-slate-400">
        Loading steam flow diagram...
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-transparent p-4 text-sm text-rose-300">
        <AlertCircle size={18} />
        Unable to load steam flow data. Please try again.
      </section>
    );
  }

  const leftConsumers = resolved.consumers.filter(
    (_, index) => index % 2 === 0,
  );

  const rightConsumers = resolved.consumers.filter(
    (_, index) => index % 2 === 1,
  );

  return (
    <section className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-3 text-slate-100 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Waves size={20} className="text-cyan-300" />

            <h2 className="text-base font-semibold tracking-wide">
              Steam Flow
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Boiler supply → steam header → distribution consumers
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${
              isFetching ? "animate-pulse bg-amber-400" : "bg-emerald-400"
            }`}
          />

          {isFetching ? "Updating" : "System overview"}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryItem
          label="Main steam"
          value={formatFlow(resolved.mainFlow)}
          icon={Gauge}
          tone="violet"
        />

        <SummaryItem
          label="Distribution"
          value={formatFlow(resolved.distribution)}
          icon={Activity}
          tone="cyan"
        />

        <SummaryItem
          label="Unaccounted difference"
          value={formatFlow(resolved.losses)}
          icon={AlertCircle}
          tone="rose"
        />
      </div>

      {/* Transparent process diagram */}
      <div className="overflow-x-auto rounded-lg border border-white/[0.07] bg-transparent p-3 sm:p-5">
        <div className="mx-auto min-w-[520px] max-w-4xl">
          {/* Boilers */}
          <SectionLabel>Steam generation</SectionLabel>

          <div className="relative mx-auto mt-3 grid max-w-xl grid-cols-2 gap-4 px-2">
            <BoilerNode title="Bio-Gas Boiler" subtitle="Steam source" />

            <BoilerNode title="LPG-Gas Boiler" subtitle="Steam source" />

            <div className="pointer-events-none absolute left-1/4 top-full h-5 w-px bg-slate-600" />

            <div className="pointer-events-none absolute left-3/4 top-full h-5 w-px bg-slate-600" />
          </div>

          {/* Common steam header */}
          <div className="relative mx-auto mt-5 max-w-2xl">
            <div className="absolute left-1/4 right-1/4 top-0 h-px bg-slate-600" />

            <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-slate-600" />

            <div className="relative rounded-md border border-cyan-400/30 bg-transparent px-4 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Common Steam Header
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Combined boiler supply
              </div>
            </div>
          </div>

          {/* Main meter */}
          <div className="relative flex flex-col items-center">
            <div className="h-5 w-px bg-cyan-400/50" />

            <div className="z-10 w-64 max-w-full rounded-lg border border-violet-400/40 bg-transparent px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-violet-200">
                <Gauge size={14} />
                Main Steam Flow Meter
              </div>

              <div className="mt-1 text-xl font-semibold text-violet-200">
                {formatFlow(resolved.mainFlow)}
              </div>

              <div className="mt-1 text-[10px] text-slate-500">
                {resolved.hasMainReading
                  ? "Explicit flow reading found"
                  : "Steam flow point not found in supplied data"}
              </div>
            </div>

            <div className="h-6 w-px bg-cyan-400/50" />
          </div>

          {/* Distribution branches */}
          <SectionLabel>Distribution network</SectionLabel>

          <div className="relative mt-3">
            <div className="absolute left-[25%] right-[25%] top-0 h-px bg-cyan-400/40" />

            <div className="grid grid-cols-2 gap-5">
              {/* Branch A */}
              <div className="relative border-l border-cyan-400/30 pl-2">
                <div className="absolute -top-3 left-0 h-3 w-px bg-cyan-400/40" />

                <div className="mb-2 flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Branch A
                  </span>

                  <span className="text-[10px] text-slate-500">
                    {leftConsumers.length} points
                  </span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {leftConsumers.map((consumer) => (
                    <ConsumerNode
                      key={consumer.key}
                      name={consumer.name}
                      value={consumer.value}
                      hasReading={consumer.hasReading}
                    />
                  ))}
                </div>
              </div>

              {/* Branch B */}
              <div className="relative border-l border-cyan-400/30 pl-2">
                <div className="absolute -top-3 left-0 h-3 w-px bg-cyan-400/40" />

                <div className="mb-2 flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Branch B
                  </span>

                  <span className="text-[10px] text-slate-500">
                    {rightConsumers.length} points
                  </span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {rightConsumers.map((consumer) => (
                    <ConsumerNode
                      key={consumer.key}
                      name={consumer.name}
                      value={consumer.value}
                      hasReading={consumer.hasReading}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <StatusDot active />
              <span>Explicit flow point found</span>
            </div>

            <div className="flex items-center gap-2">
              <StatusDot active={false} />
              <span>No flow point found</span>
            </div>

            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>Backend-dependent readings</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        A displayed 0.00 t/h is a fallback when no explicit steam-flow reading
        is available; it does not confirm measured flow is zero. The difference
        between supply and distribution is not a verified physical leak.
      </p>
    </section>
  );
};

export default SteamFlow;

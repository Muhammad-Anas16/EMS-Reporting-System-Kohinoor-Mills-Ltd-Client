import { useMemo, useState } from "react";
import {
  Activity,
  Gauge,
  Zap,
  ChevronDown,
  Radio,
  Layers3,
} from "lucide-react";
import { useParams } from "react-router";
import ElectricalFlowDiagram from "./ElectricalFlowDiagram";

const DEPARTMENT_COLORS = [
  "#34D399",
  "#38BDF8",
  "#FBBF24",
  "#A78BFA",
  "#FB7185",
  "#2DD4BF",
  "#F97316",
  "#818CF8",
];

const FIELDS = {
  power: {
    label: "Power Flow",
    unit: "kW",
    summaryKey: "totalPower",
    icon: Zap,
    color: "#22D3EE",
  },
  kwh: {
    label: "Energy Flow",
    unit: "kWh",
    summaryKey: "totalKwh",
    icon: Gauge,
    color: "#60A5FA",
  },
  amp: {
    label: "Current Flow",
    unit: "A",
    summaryKey: "totalAmp",
    icon: Activity,
    color: "#C084FC",
  },
};

const SOURCE_POSITIONS = [
  { x: 90, y: 105 },
  { x: 90, y: 260 },
  { x: 90, y: 415 },
];

const DEPARTMENT_POSITIONS = [
  { x: 850, y: 70 },
  { x: 850, y: 165 },
  { x: 850, y: 260 },
  { x: 850, y: 355 },
  { x: 850, y: 450 },
];

const CENTER = { x: 475, y: 260 };

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return null;
  }

  return Number(value);
};

const getReading = (meter, field) => {
  const candidates = [
    meter?.readings?.[field]?.liveValue,
    meter?.live?.[field],
    meter?.readings?.[field]?.value,
    meter?.[field],
  ];

  for (const candidate of candidates) {
    const value = toNumber(candidate);
    if (value !== null) return value;
  }

  return null;
};

const formatNumber = (value) => {
  const number = toNumber(value);

  if (number === null) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(number);
};

const shortNumber = (value) => {
  const number = toNumber(value);

  if (number === null) return "—";

  const absolute = Math.abs(number);

  if (absolute >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(2)}M`;
  }

  if (absolute >= 10_000) {
    return `${(number / 1_000).toFixed(1)}k`;
  }

  return formatNumber(number);
};

const isSourceMeter = (meter) => {
  if (
    meter?.isSource === true ||
    meter?.isIncoming === true ||
    normalize(meter?.role) === "source" ||
    normalize(meter?.meter_type) === "source" ||
    normalize(meter?.meterType) === "source"
  ) {
    return true;
  }

  const key = normalize(meter?.meter_key || meter?.meter_name || meter?.name);

  return /^(lesco|kgl|solar|boiler_out|boiler_supply|incoming_supply)(_|$)/.test(
    key,
  );
};

const getDepartmentLabel = (meter) => {
  const label =
    meter?.department_label || meter?.departmentName || meter?.department_name;

  if (label) return String(label).trim();

  return String(meter?.department || "Unassigned")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const DivisionMetrics = ({ summary = {}, meters = [] }) => {
  const params = useParams();
  const [selectedField, setSelectedField] = useState("power");

  const config = FIELDS[selectedField];
  const MainIcon = config.icon;

  const safeMeters = useMemo(() => {
    const input = Array.isArray(meters) ? meters : [];
    const divisionParam = normalize(params?.division);
    const departmentParam = normalize(params?.department).replace(
      /_department$/,
      "",
    );

    return input.filter((meter) => {
      if (
        divisionParam &&
        normalize(meter?.division) &&
        normalize(meter.division) !== divisionParam
      ) {
        return false;
      }

      if (departmentParam) {
        const department = normalize(meter?.department);
        const label = normalize(getDepartmentLabel(meter));

        if (
          department !== departmentParam &&
          label !== departmentParam &&
          !department.endsWith(`_${departmentParam}`)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [meters, params?.division, params?.department]);

  const { sourceMeters, departmentData } = useMemo(() => {
    const sources = safeMeters
      .filter(isSourceMeter)
      .map((meter) => ({
        name:
          meter?.meter_name ||
          meter?.meter_key ||
          meter?.name ||
          "Unnamed source",
        value: getReading(meter, selectedField),
      }))
      .filter((source) => source.value !== null)
      .slice(0, SOURCE_POSITIONS.length);

    const departments = new Map();

    safeMeters.forEach((meter) => {
      if (isSourceMeter(meter)) return;

      const key = normalize(meter?.department) || "unassigned";

      if (!departments.has(key)) {
        departments.set(key, {
          key,
          label: getDepartmentLabel(meter),
          color: DEPARTMENT_COLORS[departments.size % DEPARTMENT_COLORS.length],
          meters: [],
          meterCount: 0,
          availableCount: 0,
          total: 0,
        });
      }

      const department = departments.get(key);
      department.meters.push(meter);
      department.meterCount += 1;

      const reading = getReading(meter, selectedField);

      if (reading !== null) {
        department.availableCount += 1;
        department.total += reading;
      }
    });

    return {
      sourceMeters: sources,
      departmentData: Array.from(departments.values()),
    };
  }, [safeMeters, selectedField]);

  const availableCount = useMemo(
    () =>
      safeMeters.filter(
        (meter) =>
          !isSourceMeter(meter) && getReading(meter, selectedField) !== null,
      ).length,
    [safeMeters, selectedField],
  );

  const totalValue = useMemo(() => {
    const summaryValue = toNumber(summary?.[config.summaryKey]);

    if (params?.department) {
      return departmentData.reduce(
        (total, department) => total + department.total,
        0,
      );
    }

    if (summaryValue !== null) return summaryValue;

    return departmentData.reduce(
      (total, department) => total + department.total,
      0,
    );
  }, [summary, config.summaryKey, params?.department, departmentData]);

  const maxDepartmentValue = Math.max(
    1,
    ...departmentData.map((department) => Math.abs(department.total)),
  );

  const sourcePaths = sourceMeters.map((_, index) => {
    const point = SOURCE_POSITIONS[index];

    return {
      id: `division-source-${selectedField}-${index}`,
      d: `M ${point.x + 27} ${point.y} C 260 ${point.y}, 315 ${CENTER.y}, ${CENTER.x - 46} ${CENTER.y}`,
    };
  });

  const diagramDepartments = departmentData.slice(
    0,
    DEPARTMENT_POSITIONS.length,
  );

  const departmentPaths = diagramDepartments.map((department, index) => {
    const point = DEPARTMENT_POSITIONS[index];

    return {
      id: `division-dept-${selectedField}-${department.key}`,
      d: `M ${CENTER.x + 46} ${CENTER.y} C 650 ${CENTER.y}, 715 ${point.y}, ${point.x - 28} ${point.y}`,
      color: department.color,
    };
  });

  return (
    <section className="division-power-flow min-w-0 w-full space-y-4 text-slate-200 sm:space-y-5">
      <style>{`
        .division-power-flow {
          --flow-border: rgba(148,163,184,.15);
          --flow-muted: #94a3b8;
          color-scheme: dark;
        }

        .division-power-flow .premium-panel {
          min-width: 0;
          border: 1px solid var(--flow-border);
          border-radius: 16px;
          background:
            radial-gradient(ellipse at top right, rgba(56,189,248,.07), transparent 42%),
            linear-gradient(145deg, rgba(15,23,42,.96), rgba(8,15,29,.98));
          box-shadow: 0 12px 30px rgba(0,0,0,.12);
        }

        .division-power-flow .premium-stat {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 14px;
          background: linear-gradient(145deg, rgba(30,41,59,.7), rgba(15,23,42,.86));
          padding: 13px;
          transition: border-color .2s ease, transform .2s ease;
        }

        .division-power-flow .premium-stat:hover {
          border-color: rgba(148,163,184,.3);
          transform: translateY(-1px);
        }

        .division-power-flow .premium-stat::after {
          position: absolute;
          top: 0;
          right: 12px;
          left: 12px;
          height: 1px;
          content: "";
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
        }

        .division-power-flow .flow-bar {
          position: relative;
          overflow: hidden;
          background: rgba(148,163,184,.13);
        }

        .division-power-flow .flow-bar::after {
          position: absolute;
          inset: 0;
          content: "";
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: translateX(-100%);
          animation: division-shimmer 3s linear infinite;
        }

        .division-power-flow .metric-select {
          width: 100%;
          min-width: 0;
          appearance: none;
          border: 0;
          outline: 0;
          background: transparent;
          color: white;
          font-size: 12px;
        }

        .division-power-flow .metric-select option {
          background: #0f172a;
          color: white;
        }

        @keyframes division-shimmer {
          to { transform: translateX(100%); }
        }

        @media (max-width: 639px) {
          .division-power-flow .premium-stat {
            padding: 11px;
            border-radius: 12px;
          }

          .division-power-flow .premium-stat:hover {
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .division-power-flow .flow-bar::after {
            animation: none !important;
          }

          .division-power-flow .premium-stat {
            transition: none;
          }
        }
      `}</style>

      <header className="premium-panel flex min-w-0 flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 lg:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12"
            style={{
              color: config.color,
              borderColor: `${config.color}45`,
              background: `${config.color}12`,
              boxShadow: `inset 0 0 18px ${config.color}0a`,
            }}
          >
            <MainIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-white sm:text-base">
                {config.label}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-1 text-[10px] font-medium text-emerald-300">
                <Radio className="h-3 w-3" />
                Live readings
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Supply sources, total load and department consumers
            </p>
          </div>
        </div>

        <label className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 sm:w-auto sm:min-w-[190px]">
          <span className="shrink-0 text-xs text-slate-400">Metric</span>
          <span className="relative min-w-0 flex-1">
            <select
              value={selectedField}
              onChange={(event) => setSelectedField(event.target.value)}
              aria-label="Select electrical metric"
              className="metric-select cursor-pointer pr-6"
            >
              <option value="power">Power (kW)</option>
              <option value="kwh">Energy (kWh)</option>
              <option value="amp">Current (A)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </span>
        </label>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <article className="premium-stat col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 sm:text-xs">
              Total {config.label.replace(" Flow", "")}
            </span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                color: config.color,
                background: `${config.color}13`,
              }}
            >
              <MainIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-white sm:text-xl lg:text-2xl">
            {formatNumber(totalValue)}
            <span className="ml-1.5 text-xs font-medium text-slate-400">
              {config.unit}
            </span>
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {params?.department ? "Selected department" : "Division summary"}
          </p>
        </article>

        <article className="premium-stat">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 sm:text-xs">
              Consumer meters
            </span>
            <Layers3 className="h-4 w-4 shrink-0 text-sky-300" />
          </div>
          <p className="mt-3 break-words text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {safeMeters.filter((meter) => !isSourceMeter(meter)).length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Configured meters</p>
        </article>

        <article className="premium-stat">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 sm:text-xs">
              Readings available
            </span>
            <Activity className="h-4 w-4 shrink-0 text-emerald-300" />
          </div>
          <p className="mt-3 break-words text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {availableCount}
            <span className="ml-1 text-xs font-medium text-slate-500">
              / {safeMeters.filter((meter) => !isSourceMeter(meter)).length}
            </span>
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Meters with a valid value
          </p>
        </article>
      </div>

      {sourceMeters.length === 0 && (
        <div
          role="status"
          className="flex min-w-0 items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 sm:p-4"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
            <Zap className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-200">
              Supply-source readings unavailable
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Boiler, solar and incoming supply readings are not present in the
              current meter data. Consumer machines will not be shown as energy
              sources.
            </p>
          </div>
        </div>
      )}

      <ElectricalFlowDiagram
        config={config}
        safeMeters={safeMeters}
        sourceMeters={sourceMeters}
        departmentData={diagramDepartments}
        sourcePaths={sourcePaths}
        departmentPaths={departmentPaths}
        totalValue={totalValue}
        availableCount={availableCount}
        maxDepartmentValue={maxDepartmentValue}
        SOURCE_POSITIONS={SOURCE_POSITIONS}
        DEPARTMENT_POSITIONS={DEPARTMENT_POSITIONS}
        CENTER={CENTER}
        formatNumber={formatNumber}
        shortNumber={shortNumber}
      />

      <section className="min-w-0 space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white sm:text-base">
              Department breakdown
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Meter readings grouped by the department provided by the API
            </p>
          </div>
          <span className="text-[10px] text-slate-500">
            {departmentData.length} departments
          </span>
        </div>

        {departmentData.length === 0 ? (
          <div className="premium-panel px-4 py-8 text-center">
            <Layers3 className="mx-auto h-6 w-6 text-slate-500" />
            <p className="mt-3 text-sm font-medium text-slate-300">
              No department meters found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Check the selected division and department filters.
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {departmentData.map((department) => {
              const percentage = Math.min(
                100,
                (Math.abs(department.total) / maxDepartmentValue) * 100,
              );

              const tooltip =
                `${department.label} | Total: ${formatNumber(department.total)} ${config.unit}` +
                ` | Readings: ${department.availableCount}/${department.meterCount}`;

              return (
                <article
                  key={department.key}
                  title={tooltip}
                  aria-label={tooltip}
                  className="min-w-0 rounded-xl border border-white/[0.08] bg-gradient-to-br from-slate-900/90 to-slate-950/80 p-3.5 transition-colors hover:border-white/[0.18] sm:p-4"
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background: department.color,
                          boxShadow: `0 0 10px ${department.color}60`,
                        }}
                      />
                      <h4 className="truncate text-xs font-semibold text-slate-200 sm:text-sm">
                        {department.label}
                      </h4>
                    </div>
                    <span className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-slate-400">
                      {department.meterCount} meters
                    </span>
                  </div>

                  <div className="mt-4 flex min-w-0 items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-xl font-semibold tracking-tight text-white sm:text-2xl">
                        {formatNumber(department.total)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {config.unit}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-slate-300">
                        {formatNumber(percentage)}%
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Relative load
                      </p>
                    </div>
                  </div>

                  <div className="flow-bar mt-4 h-1.5 rounded-full">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: department.color,
                        boxShadow: `0 0 10px ${department.color}45`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-[10px] text-slate-500">
                    {department.availableCount} of {department.meterCount}{" "}
                    readings available
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};

export default DivisionMetrics;

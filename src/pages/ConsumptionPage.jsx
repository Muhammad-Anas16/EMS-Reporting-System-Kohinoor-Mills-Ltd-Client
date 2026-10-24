import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Download,
  Droplets,
  Flame,
  Gauge,
  RefreshCw,
  Search,
  Wind,
  Zap,
} from "lucide-react";

import { useBacnetDashboard } from "@/hooks/useBacnetDashboard";
import api, { getEnergyLog, getTrendLog } from "@/api/api";

import LineChart from "@/components/chart/lineChart";
import MiniBarChart from "@/components/chart/MiniBarChart";
import PieChartLabelList from "@/components/chart/PieChartLabelList";
import RadialBreakdownChart from "@/components/chart/RadialBreakdownChart";
import Panel from "@/components/dashboard/Panel";

const UTILITIES = [
  {
    key: "electrical",
    label: "Electricity",
    unit: "kW",
    icon: Zap,
    color: "#34d399",
    aliases: ["electricity", "electrical", "power", "kw", "load"],
    fields: ["power"],
    historyType: "energy",
  },
  {
    key: "water",
    label: "Water",
    unit: "m³/h",
    icon: Droplets,
    color: "#22d3ee",
    aliases: ["water", "water flow", "water meter", "water consumption"],
    fields: ["water", "waterFlow", "waterConsumption", "waterVolume"],
    historyType: "trend",
  },
  {
    key: "steam",
    label: "Steam",
    unit: "t/h",
    icon: Flame,
    color: "#a78bfa",
    aliases: ["steam", "steam flow", "boiler steam"],
    fields: ["steam", "steamFlow", "steamConsumption", "steamMassFlow"],
    historyType: "trend",
  },
  {
    key: "gas",
    label: "Gas",
    unit: "m³/h",
    icon: Activity,
    color: "#fbbf24",
    aliases: ["gas", "gas flow", "natural gas"],
    fields: ["gas", "gasFlow", "gasConsumption", "gasVolume"],
    historyType: "trend",
  },
  {
    key: "air",
    label: "Compressed Air",
    unit: "bar",
    icon: Wind,
    color: "#60a5fa",
    aliases: ["compressed air", "air pressure", "air flow"],
    fields: [
      "air",
      "airFlow",
      "compressedAir",
      "airPressure",
      "airConsumption",
    ],
    historyType: "trend",
  },
];

const CHART_COLORS = [
  "#22d3ee",
  "#34d399",
  "#60a5fa",
  "#c084fc",
  "#fbbf24",
  "#fb7185",
  "#a3e635",
  "#f97316",
];

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

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

const formatNumber = (value, digits = 2) => {
  const number = toNumber(value);

  if (number === null) return "—";

  return number.toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getLiveReading = (meter, fields) => {
  for (const field of fields) {
    const candidates = [
      meter?.readings?.[field]?.liveValue,
      meter?.live?.[field],
      meter?.[field],
    ];

    for (const candidate of candidates) {
      const value = toNumber(candidate);
      if (value !== null) return value;
    }
  }

  return null;
};

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return [];

  const candidates = [
    payload.data,
    payload.response,
    payload.results,
    payload.records,
    payload.items,
    payload.history,
    payload.values,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    if (isObject(candidate)) {
      const nested = getRows(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
};

const getPointName = (point) =>
  normalize(
    point?.name ??
      point?.pointName ??
      point?.point_name ??
      point?.label ??
      point?.description ??
      point?.meter_name ??
      point?.meterName ??
      point?.parameterName ??
      point?.parameter_name ??
      point?.objectName ??
      point?.title,
  );

const getPointInstance = (point) =>
  point?.instance ??
  point?.instanceNumber ??
  point?.objectInstance ??
  point?.object_instance ??
  point?.pointId ??
  point?.point_id ??
  null;

const findMatchingLog = (logs, utility) => {
  const aliases = utility.aliases.map(normalize);

  return (
    getRows(logs).find((row) => {
      const name = getPointName(row);
      const instance = getPointInstance(row);

      return (
        instance !== null &&
        instance !== undefined &&
        String(instance).trim() !== "" &&
        aliases.some((alias) => name === alias || name.includes(alias))
      );
    }) ?? null
  );
};

const toApiDate = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

const getTimestamp = (point) => {
  const raw =
    point?.timestamp ??
    point?.dateTime ??
    point?.datetime ??
    point?.date_time ??
    point?.date ??
    point?.time ??
    point?.loggedAt ??
    point?.logged_at ??
    point?.DateTime ??
    point?.Timestamp;

  if (raw === undefined || raw === null || raw === "") return null;

  const numeric = Number(raw);
  const timestamp = Number.isFinite(numeric)
    ? numeric < 1e12
      ? numeric * 1000
      : numeric
    : new Date(raw).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
};

const getPointValue = (point) => {
  const candidates = [
    point?.value,
    point?.reading,
    point?.presentValue,
    point?.present_value,
    point?.consumption,
    point?.energy,
    point?.kwh,
    point?.total,
    point?.y,
    point?.Value,
    point?.Reading,
  ];

  for (const candidate of candidates) {
    const value = toNumber(candidate);
    if (value !== null) return value;
  }

  return null;
};

const normalizeHistory = (payload) =>
  getRows(payload)
    .map((point, index) => {
      const timestamp = getTimestamp(point);
      const value = getPointValue(point);

      if (value === null) return null;

      return {
        id: `${timestamp ?? "untimed"}-${index}`,
        timestamp,
        value,
        label: timestamp
          ? new Date(timestamp).toLocaleString([], {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : `Record ${index + 1}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

const getMeterValue = (meter, field) => {
  const candidates = [
    meter?.readings?.[field]?.liveValue,
    meter?.live?.[field],
    meter?.[field],
  ];

  for (const candidate of candidates) {
    const value = toNumber(candidate);
    if (value !== null) return value;
  }

  return null;
};

const getMeterPower = (meter) => getMeterValue(meter, "power");
const getMeterKwh = (meter) => getMeterValue(meter, "kwh");
const getMeterAmp = (meter) => getMeterValue(meter, "amp");

const getDepartmentLabel = (meter) =>
  String(meter?.department || "Unassigned")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const downloadCsv = (filename, rows) => {
  if (!rows.length) return;

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const StatCard = ({ label, value, unit, icon: Icon, color, detail }) => (
  <article className="min-w-0 rounded-xl border border-white/10 bg-transparent p-4 transition-colors duration-200 hover:border-white/20 sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium text-neutral-400">{label}</p>
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10"
        style={{ color, backgroundColor: `${color}12` }}
      >
        <Icon size={18} />
      </span>
    </div>

    <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
      {formatNumber(value)}
      <span className="ml-1.5 text-xs font-medium text-neutral-500">
        {unit}
      </span>
    </p>

    <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
      {detail}
    </p>
  </article>
);

const SectionHint = ({ children }) => (
  <p className="mt-1 text-xs leading-relaxed text-neutral-500">{children}</p>
);

const ConsumptionPage = () => {
  const { division: routeDivision = "dyeing" } = useParams();

  const divisionKey = normalize(decodeURIComponent(routeDivision));
  const divisionLabel = decodeURIComponent(routeDivision)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  const {
    data: dashboardData,
    isPending: isLiveLoading,
    isFetching: isLiveRefreshing,
    refetch: refreshLive,
    error: liveError,
  } = useBacnetDashboard();

  const meters = useMemo(() => {
    const divisions = dashboardData?.divisions ?? {};
    const matchingKey = Object.keys(divisions).find(
      (candidate) => normalize(candidate) === divisionKey,
    );

    if (matchingKey && Array.isArray(divisions[matchingKey])) {
      return divisions[matchingKey];
    }

    return (dashboardData?.meters ?? []).filter(
      (meter) => normalize(meter?.division) === divisionKey,
    );
  }, [dashboardData, divisionKey]);

  const [selectedKey, setSelectedKey] = useState("electrical");

  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return getLocalDateString(start);
  });

  const [endDate, setEndDate] = useState(() => getLocalDateString());

  const [trendLogs, setTrendLogs] = useState([]);
  const [energyLogs, setEnergyLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");

  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySourceName, setHistorySourceName] = useState("");
  const [historyInstance, setHistoryInstance] = useState(null);

  const [meterSearch, setMeterSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const selectedUtility =
    UTILITIES.find((utility) => utility.key === selectedKey) ?? UTILITIES[0];

  const readings = useMemo(
    () =>
      Object.fromEntries(
        UTILITIES.map((utility) => {
          const values = meters
            .map((meter) => getLiveReading(meter, utility.fields))
            .filter((value) => value !== null);

          return [
            utility.key,
            values.length
              ? values.reduce((total, value) => total + value, 0)
              : null,
          ];
        }),
      ),
    [meters],
  );

  const totalPower = useMemo(() => {
    const values = meters.map(getMeterPower).filter((value) => value !== null);

    return values.length
      ? values.reduce((total, value) => total + value, 0)
      : null;
  }, [meters]);

  const totalKwh = useMemo(() => {
    const values = meters.map(getMeterKwh).filter((value) => value !== null);

    return values.length
      ? values.reduce((total, value) => total + value, 0)
      : null;
  }, [meters]);

  const totalAmp = useMemo(() => {
    const values = meters.map(getMeterAmp).filter((value) => value !== null);

    return values.length
      ? values.reduce((total, value) => total + value, 0)
      : null;
  }, [meters]);

  const metersWithPower = useMemo(
    () => meters.filter((meter) => getMeterPower(meter) !== null).length,
    [meters],
  );

  const liveAvailableCount = Object.values(readings).filter(
    (value) => value !== null,
  ).length;

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          meters.map((meter) => normalize(meter?.department) || "unassigned"),
        ),
      ).sort(),
    [meters],
  );

  const meterRows = useMemo(() => {
    const search = normalize(meterSearch);

    return meters
      .filter((meter) => {
        const department = normalize(meter?.department) || "unassigned";

        const matchesDepartment =
          departmentFilter === "all" || department === departmentFilter;

        const searchable = normalize(
          `${meter?.meter_name ?? ""} ${meter?.meter_key ?? ""} ${meter?.department ?? ""}`,
        );

        return matchesDepartment && (!search || searchable.includes(search));
      })
      .map((meter) => ({
        ...meter,
        displayName: meter?.meter_name || meter?.meter_key || "Unnamed meter",
        displayDepartment: getDepartmentLabel(meter),
        displayPower: getMeterPower(meter),
        displayKwh: getMeterKwh(meter),
        displayAmp: getMeterAmp(meter),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [meters, meterSearch, departmentFilter]);

  const departmentBreakdown = useMemo(() => {
    const grouped = new Map();

    meters.forEach((meter) => {
      const name = getDepartmentLabel(meter);
      const power = getMeterPower(meter);
      const kwh = getMeterKwh(meter);
      const current = grouped.get(name) ?? {
        name,
        power: null,
        kwh: null,
        powerCount: 0,
        kwhCount: 0,
      };

      if (power !== null) {
        current.power = (current.power ?? 0) + power;
        current.powerCount += 1;
      }

      if (kwh !== null) {
        current.kwh = (current.kwh ?? 0) + kwh;
        current.kwhCount += 1;
      }

      grouped.set(name, current);
    });

    return Array.from(grouped.values()).sort(
      (a, b) => (b.power ?? -1) - (a.power ?? -1),
    );
  }, [meters]);

  const departmentPowerChart = useMemo(
    () =>
      departmentBreakdown
        .filter((item) => item.power !== null && item.power > 0)
        .map((item, index) => ({
          name: item.name,
          value: item.power,
          color: CHART_COLORS[index % CHART_COLORS.length],
        })),
    [departmentBreakdown],
  );

  const departmentEnergyChart = useMemo(
    () =>
      departmentBreakdown
        .filter((item) => item.kwh !== null && item.kwh >= 0)
        .map((item, index) => ({
          name: item.name,
          value: item.kwh,
          color: CHART_COLORS[index % CHART_COLORS.length],
        })),
    [departmentBreakdown],
  );

  const loadLogLists = useCallback(async () => {
    setLogsLoading(true);
    setLogsError("");

    try {
      const [trends, energy] = await Promise.all([
        getTrendLog(),
        getEnergyLog(),
      ]);

      setTrendLogs(getRows(trends));
      setEnergyLogs(getRows(energy));

      if (trends?.success === false || energy?.success === false) {
        setLogsError(
          trends?.message ||
            energy?.message ||
            "History log configuration could not be loaded.",
        );
      }
    } catch (error) {
      setLogsError(
        error?.message || "History log configuration could not be loaded.",
      );
      setTrendLogs([]);
      setEnergyLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogLists();
  }, [loadLogLists]);

  const matchingLog = useMemo(() => {
    const source =
      selectedUtility.historyType === "energy" ? energyLogs : trendLogs;

    return findMatchingLog(source, selectedUtility);
  }, [energyLogs, trendLogs, selectedUtility]);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      setHistoryRows([]);
      setHistoryError("");
      setHistorySourceName("");
      setHistoryInstance(null);

      if (!startDate || !endDate) {
        setHistoryError("Select both a start date and an end date.");
        return;
      }

      if (startDate > endDate) {
        setHistoryError("Start date must be on or before the end date.");
        return;
      }

      if (logsLoading) return;

      if (!matchingLog) {
        setHistoryError(
          `No configured ${selectedUtility.historyType} log matches ${selectedUtility.label}. Check the existing log names and point mapping.`,
        );
        return;
      }

      const instance = getPointInstance(matchingLog);

      if (
        instance === null ||
        instance === undefined ||
        String(instance).trim() === ""
      ) {
        setHistoryError(
          "The matching history point does not contain an instance ID.",
        );
        return;
      }

      const parametersValue =
        matchingLog?.parameters ??
        matchingLog?.parameter ??
        matchingLog?.parametersList ??
        matchingLog?.parameterList ??
        [];

      const parameters = Array.isArray(parametersValue)
        ? parametersValue
        : parametersValue === null ||
            parametersValue === undefined ||
            parametersValue === ""
          ? []
          : [parametersValue];

      if (selectedUtility.historyType === "energy" && !parameters.length) {
        setHistoryError(
          "The configured energy log has no parameter list. Historical electricity data cannot be requested until a valid energy-log configuration is available.",
        );
        return;
      }

      setHistoryLoading(true);

      try {
        const request = {
          instance,
          startDate: toApiDate(startDate),
          endDate: toApiDate(endDate),
          startTime: "00:00",
          endTime: "23:59",
        };

        const response =
          selectedUtility.historyType === "energy"
            ? await api.post("/data/energylogdata", {
                ...request,
                parameters,
              })
            : await api.post("/data/trendlogdata", request);

        if (!active) return;

        const body = response?.data?.data ?? response?.data ?? response;

        if (body?.success === false) {
          setHistoryError(
            body?.message || "Historical readings could not be loaded.",
          );
          return;
        }

        const rows = normalizeHistory(body);

        setHistoryRows(rows);
        setHistorySourceName(
          getPointName(matchingLog) || selectedUtility.label,
        );
        setHistoryInstance(instance);

        if (!rows.length) {
          setHistoryError(
            "The API returned no usable values for this utility and date range.",
          );
        }
      } catch (error) {
        if (!active) return;

        setHistoryError(
          error?.response?.data?.message ||
            error?.message ||
            "Historical readings could not be loaded.",
        );
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [selectedUtility, startDate, endDate, matchingLog, logsLoading]);

  const historyStats = useMemo(() => {
    if (!historyRows.length) return null;

    const values = historyRows.map((point) => point.value);
    const total = values.reduce((sum, value) => sum + value, 0);

    return {
      latest: values[values.length - 1],
      peak: Math.max(...values),
      average: total / values.length,
      total,
      count: values.length,
    };
  }, [historyRows]);

  const setPreset = (days) => {
    const end = new Date();
    const start = new Date();

    start.setDate(start.getDate() - days + 1);

    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
  };

  const exportHistoryCsv = () => {
    downloadCsv(
      `${divisionKey}-${selectedUtility.key}-history-${startDate}-to-${endDate}.csv`,
      [
        ["Timestamp", selectedUtility.label, `Unit (${selectedUtility.unit})`],
        ...historyRows.map((row) => [
          row.timestamp ? new Date(row.timestamp).toISOString() : row.label,
          row.value,
          selectedUtility.unit,
        ]),
      ],
    );
  };

  const exportMetersCsv = () => {
    downloadCsv(`${divisionKey}-meter-consumption.csv`, [
      ["Meter", "Department", "Power (kW)", "Energy (kWh)", "Current (A)"],
      ...meterRows.map((meter) => [
        meter.displayName,
        meter.displayDepartment,
        meter.displayPower ?? "",
        meter.displayKwh ?? "",
        meter.displayAmp ?? "",
      ]),
    ]);
  };

  const exportDepartmentCsv = () => {
    downloadCsv(`${divisionKey}-department-consumption.csv`, [
      [
        "Department",
        "Power (kW)",
        "Meters with power",
        "Energy (kWh)",
        "Meters with energy",
      ],
      ...departmentBreakdown.map((item) => [
        item.name,
        item.power ?? "",
        item.powerCount,
        item.kwh ?? "",
        item.kwhCount,
      ]),
    ]);
  };

  return (
    <main className="min-h-screen min-w-0 bg-black px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-7">
      <div className="mx-auto max-w-[1800px] space-y-5 sm:space-y-6">
        <header className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/75">
              Energy & Utilities Management
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Consumption Overview
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-neutral-500 sm:text-sm">
              {divisionLabel} Division · Live readings, meter consumption,
              department breakdown and historical trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-white/10 bg-transparent px-3 py-2.5 sm:px-4">
              <p className="text-[10px] text-neutral-500">
                Meters with power data
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {metersWithPower} / {meters.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                refreshLive();
                loadLogLists();
              }}
              disabled={isLiveRefreshing || logsLoading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-3 py-2.5 text-xs font-medium text-neutral-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  isLiveRefreshing || logsLoading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </header>

        {liveError && (
          <div className="flex min-w-0 items-start gap-3 rounded-xl border border-amber-400/20 bg-transparent p-3 sm:p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-200">
                Live readings could not be refreshed
              </p>
              <p className="mt-1 break-words text-xs leading-relaxed text-neutral-400">
                {liveError.message ||
                  "Check the connection to the existing API."}
              </p>
            </div>
          </div>
        )}

        <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total live power"
            value={totalPower}
            unit="kW"
            icon={Zap}
            color="#34d399"
            detail={`${metersWithPower} meters with valid power readings`}
          />
          <StatCard
            label="Total live energy"
            value={totalKwh}
            unit="kWh"
            icon={Gauge}
            color="#60a5fa"
            detail="Sum of available meter kWh readings"
          />
          <StatCard
            label="Total current"
            value={totalAmp}
            unit="A"
            icon={Activity}
            color="#c084fc"
            detail="Sum of available meter current readings"
          />
          <StatCard
            label="Utility readings"
            value={`${liveAvailableCount}/${UTILITIES.length}`}
            unit="available"
            icon={CheckCircle2}
            color="#22d3ee"
            detail="Utilities with a mapped live reading"
          />
        </section>

        {/* Animated live power indicator */}
        <Panel
          title="Live power activity"
          subtitle="Animated indicator based on the current measured power."
          icon={Activity}
          className="bg-transparent"
        >
          <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-5">
            <div className="flex items-center gap-4">
              <div className="relative grid h-20 w-20 shrink-0 place-items-center">
                <span className="absolute inset-1 animate-ping rounded-full border border-emerald-400/20" />
                <span className="absolute inset-2 animate-pulse rounded-full border border-emerald-400/40" />
                <span className="relative grid h-12 w-12 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300">
                  <Zap size={23} />
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-neutral-500">
                  Current measured load
                </p>
                <p className="mt-1 break-words text-2xl font-semibold text-white">
                  {formatNumber(totalPower)}
                  <span className="ml-1.5 text-xs text-neutral-500">kW</span>
                </p>
                <p className="mt-1 flex items-center gap-2 text-[10px] text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {isLiveLoading
                    ? "Loading live readings"
                    : isLiveRefreshing
                      ? "Refreshing readings"
                      : "Live dashboard state"}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-neutral-400">
                  Meter power availability
                </span>
                <span className="text-white">
                  {metersWithPower} / {meters.length}
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]"
                role="progressbar"
                aria-label="Meters with power readings"
                aria-valuemin={0}
                aria-valuemax={meters.length || 1}
                aria-valuenow={metersWithPower}
              >
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-700 ease-out"
                  style={{
                    width: `${meters.length ? (metersWithPower / meters.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
                The animation indicates live dashboard activity; it is not a
                separate sensor or a prediction of future consumption.
              </p>
            </div>
          </div>
        </Panel>

        <section className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white sm:text-lg">
                Utility-wise consumption
              </h2>
              <SectionHint>
                Select a utility to inspect its configured historical records.
              </SectionHint>
            </div>
            <span className="text-[10px] text-neutral-500">
              {liveAvailableCount} of {UTILITIES.length} utilities available
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {UTILITIES.map((utility) => {
              const Icon = utility.icon;
              const value = readings[utility.key];
              const available = value !== null;
              const selected = selectedKey === utility.key;

              return (
                <button
                  key={utility.key}
                  type="button"
                  onClick={() => setSelectedKey(utility.key)}
                  aria-pressed={selected}
                  className={`min-w-0 rounded-xl border bg-transparent p-4 text-left transition-colors duration-200 ${
                    selected
                      ? "border-white/25"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  style={{
                    boxShadow: selected
                      ? `inset 0 2px ${utility.color}`
                      : "none",
                  }}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10"
                      style={{
                        color: utility.color,
                        backgroundColor: `${utility.color}12`,
                      }}
                    >
                      <Icon size={19} />
                    </span>
                    <span
                      className={`max-w-[110px] truncate text-right text-[10px] ${
                        available ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {available ? "Available" : "No live reading"}
                    </span>
                  </div>

                  <p className="mt-4 truncate text-xs font-medium text-neutral-400">
                    {utility.label}
                  </p>
                  <p className="mt-1 break-words text-2xl font-semibold text-white">
                    {formatNumber(value)}
                    <span className="ml-1.5 text-[10px] font-medium text-neutral-500">
                      {utility.unit}
                    </span>
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
                    <span className="text-[10px] text-neutral-500">
                      {selected ? "Selected" : "View history"}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        available ? "animate-pulse" : ""
                      }`}
                      style={{ backgroundColor: utility.color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Additional chart: meter power distribution by department */}
        <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel
            title="Department power distribution"
            subtitle="Share of available measured power by department."
            icon={PieChartLabelList ? Gauge : Activity}
            className="bg-transparent"
          >
            <div className="p-4 sm:p-5">
              <PieChartLabelList
                data={departmentPowerChart}
                height={280}
                dataKey="value"
                nameKey="name"
                showLabels={false}
                ariaLabel="Department power distribution"
                emptyMessage="No positive department power readings are available."
                valueFormatter={(value) => `${formatNumber(value)} kW`}
              />
              <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">
                Only departments with actual positive power readings are
                included. Different utility units are not combined in this
                chart.
              </p>
            </div>
          </Panel>

          <Panel
            title="Department energy breakdown"
            subtitle="Available meter kWh readings grouped by department."
            icon={Gauge}
            className="bg-transparent"
          >
            <div className="p-4 sm:p-5">
              <RadialBreakdownChart
                data={departmentEnergyChart}
                total={totalKwh ?? undefined}
                centerLabel="Energy kWh"
                height={260}
                ariaLabel="Department energy breakdown"
                emptyMessage="No department energy readings are available."
                valueFormatter={formatNumber}
              />
              <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">
                Values use the existing meter kWh readings. This is not a
                separately calculated historical energy total.
              </p>
            </div>
          </Panel>
        </section>

        {/* Additional chart: recent live meter readings */}
        <Panel
          title="Recent meter reading profile"
          subtitle="A compact visual comparison of current power values across the displayed meters."
          icon={Activity}
          className="bg-transparent"
        >
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-5">
            {meterRows.slice(0, 12).map((meter) => (
              <div
                key={meter.meter_key || meter.instance || meter.displayName}
                className="min-w-0 rounded-lg border border-white/10 bg-transparent p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-neutral-200">
                      {meter.displayName}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-neutral-500">
                      {meter.displayDepartment}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-emerald-300">
                    {meter.displayPower === null ? "Missing" : "Live"}
                  </span>
                </div>

                <div className="mt-3">
                  <MiniBarChart
                    values={
                      meter.displayPower === null ? [] : [meter.displayPower]
                    }
                    color="#22d3ee"
                    height={48}
                    barCount={1}
                    ariaLabel={`${meter.displayName} current power`}
                  />
                </div>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatNumber(meter.displayPower)}
                  <span className="ml-1 text-[10px] font-normal text-neutral-500">
                    kW
                  </span>
                </p>
              </div>
            ))}

            {!meterRows.length && (
              <p className="col-span-full py-8 text-center text-xs text-neutral-500">
                No meters match the current filters.
              </p>
            )}
          </div>
          {meterRows.length > 12 && (
            <p className="px-4 pb-4 text-[10px] text-neutral-500 sm:px-5">
              Showing the first 12 filtered meters. Use the complete meter table
              below to find the remaining meters.
            </p>
          )}
        </Panel>

        <Panel
          title="Historical consumption filters"
          subtitle="Load actual historical records from the existing energy or trend log configuration."
          icon={CalendarDays}
          className="bg-transparent"
        >
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Today", days: 1 },
                { label: "7 days", days: 7 },
                { label: "30 days", days: 30 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPreset(preset.days)}
                  className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-300 transition hover:bg-white/[0.06]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block min-w-0">
                <span className="mb-2 block text-xs text-neutral-400">
                  Start date
                </span>
                <span className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-transparent px-3">
                  <CalendarDays size={16} className="shrink-0 text-cyan-300" />
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none [color-scheme:dark]"
                  />
                </span>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-xs text-neutral-400">
                  End date
                </span>
                <span className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-transparent px-3">
                  <CalendarDays size={16} className="shrink-0 text-cyan-300" />
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none [color-scheme:dark]"
                  />
                </span>
              </label>

              <div className="min-w-0 rounded-lg border border-white/10 bg-transparent px-4 py-3">
                <p className="text-[10px] text-neutral-500">Selected utility</p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {selectedUtility.label}
                </p>
                <p className="mt-1 text-[10px] text-neutral-500">
                  {selectedUtility.historyType === "energy"
                    ? "Configured energy log"
                    : "Configured trend log"}
                </p>
              </div>
            </div>

            {startDate > endDate && (
              <p className="mt-3 text-xs text-amber-300">
                Start date must be on or before the end date.
              </p>
            )}
          </div>
        </Panel>

        {/* Historical chart uses the existing LineChart component */}
        <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <Panel
            title={`${selectedUtility.label} historical trend`}
            subtitle={`${startDate} to ${endDate} · ${selectedUtility.unit}`}
            icon={Activity}
            action={
              <button
                type="button"
                onClick={exportHistoryCsv}
                disabled={!historyRows.length}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={14} />
                Export CSV
              </button>
            }
            className="bg-transparent"
          >
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="max-w-full truncate rounded-lg border border-white/10 bg-transparent px-3 py-2 text-[10px] text-neutral-400">
                  {historySourceName || "Configured history point"}
                  {historyInstance !== null
                    ? ` · Instance ${historyInstance}`
                    : ""}
                </span>
                {historyRows.length > 0 && (
                  <span className="rounded-lg border border-emerald-300/15 px-3 py-2 text-[10px] text-emerald-200">
                    {historyRows.length} records
                  </span>
                )}
              </div>

              {historyStats && (
                <div className="mb-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Latest", value: historyStats.latest },
                    { label: "Peak", value: historyStats.peak },
                    { label: "Average", value: historyStats.average },
                    { label: "Records", value: historyStats.count },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="min-w-0 rounded-lg border border-white/10 bg-transparent p-3"
                    >
                      <p className="text-[10px] text-neutral-500">
                        {stat.label}
                      </p>
                      <p className="mt-1 break-words text-base font-semibold text-white">
                        {formatNumber(stat.value)}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-500">
                        {stat.label === "Records"
                          ? "Returned records"
                          : selectedUtility.unit}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {historyLoading || logsLoading ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-neutral-400">
                  <RefreshCw size={20} className="animate-spin text-cyan-300" />
                  Loading historical readings…
                </div>
              ) : historyRows.length ? (
                <LineChart
                  data={historyRows.map((point) => ({
                    label: point.label,
                    value: point.value,
                  }))}
                  height={320}
                  lineColor={selectedUtility.color}
                  colors={[selectedUtility.color]}
                  showLegend={false}
                  showGrid
                  showPoints
                  showXAxisLabels
                  ariaLabel={`${selectedUtility.label} historical consumption`}
                  emptyMessage="No historical values available."
                  valueFormatter={formatNumber}
                />
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 px-5 text-center">
                  <CircleHelp size={27} className="text-amber-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-200">
                    Historical data unavailable
                  </p>
                  <p className="mt-2 max-w-lg break-words text-xs leading-5 text-neutral-500">
                    {historyError ||
                      logsError ||
                      "No historical values were returned for this utility and date range."}
                  </p>
                  <p className="mt-2 text-[10px] text-amber-200/80">
                    No synthetic readings are generated.
                  </p>
                </div>
              )}

              {historyRows.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-3 text-xs font-medium text-neutral-300">
                    Historical reading profile
                  </p>
                  <MiniBarChart
                    values={historyRows.map((point) => point.value)}
                    color={selectedUtility.color}
                    height={68}
                    barCount={24}
                    ariaLabel={`${selectedUtility.label} recent historical values`}
                  />
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Data availability"
            subtitle="Live and historical status for each configured utility."
            icon={CheckCircle2}
            className="bg-transparent"
          >
            <div className="space-y-2 p-4 sm:p-5">
              {UTILITIES.map((utility) => {
                const available = readings[utility.key] !== null;
                const Icon = utility.icon;
                const selected = selectedKey === utility.key;

                return (
                  <button
                    key={utility.key}
                    type="button"
                    onClick={() => setSelectedKey(utility.key)}
                    className={`flex w-full min-w-0 items-center gap-3 rounded-lg border bg-transparent p-3 text-left transition ${
                      selected
                        ? "border-white/20"
                        : "border-white/[0.08] hover:border-white/15"
                    }`}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{
                        backgroundColor: `${utility.color}15`,
                        color: utility.color,
                      }}
                    >
                      <Icon size={16} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-neutral-200">
                        {utility.label}
                      </span>
                      <span className="mt-1 block break-words text-[10px] text-neutral-500">
                        Live: {formatNumber(readings[utility.key])}{" "}
                        {utility.unit}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 text-[10px] ${
                        available ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {available ? "Available" : "Missing"}
                    </span>
                  </button>
                );
              })}

              <div
                className={`mt-4 rounded-lg border p-3 ${
                  historyRows.length
                    ? "border-emerald-300/15"
                    : "border-amber-300/15"
                }`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    historyRows.length ? "text-emerald-200" : "text-amber-200"
                  }`}
                >
                  {historyRows.length ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertTriangle size={15} />
                  )}
                  <span className="text-xs font-medium">
                    Historical data status
                  </span>
                </div>
                <p className="mt-2 break-words text-[11px] leading-5 text-neutral-400">
                  {historyRows.length
                    ? `${historyRows.length} records loaded for ${selectedUtility.label}.`
                    : historyLoading || logsLoading
                      ? "Checking configured history points and loading records."
                      : historyError ||
                        logsError ||
                        "No historical records available for the selected range."}
                </p>
              </div>

              {isLiveLoading && (
                <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                  <RefreshCw size={13} className="animate-spin" />
                  Loading live BACnet readings…
                </p>
              )}
            </div>
          </Panel>
        </section>

        {/* Complete meter-wise consumption */}
        <Panel
          title="Complete meter consumption"
          subtitle={`Actual meter values returned for the ${divisionLabel} division.`}
          icon={Gauge}
          action={
            <button
              type="button"
              onClick={exportMetersCsv}
              disabled={!meterRows.length}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} />
              Export meters
            </button>
          }
          className="bg-transparent"
        >
          <div className="p-4 sm:p-5">
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="relative block min-w-0">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="search"
                  value={meterSearch}
                  onChange={(event) => setMeterSearch(event.target.value)}
                  placeholder="Search meter or department…"
                  className="w-full min-w-0 rounded-lg border border-white/10 bg-transparent py-3 pl-9 pr-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-cyan-300/40"
                />
              </label>

              <label className="block min-w-0">
                <span className="sr-only">Filter by department</span>
                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-white/10 bg-black px-3 py-3 text-xs text-white outline-none focus:border-cyan-300/40"
                >
                  <option value="all">All departments</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department.replace(/\b\w/g, (character) =>
                        character.toUpperCase(),
                      )}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-black">
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-neutral-500">
                      <th className="px-4 py-3 font-medium">Meter</th>
                      <th className="px-4 py-3 font-medium">Department</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Power
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Energy
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Current
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.06]">
                    {meterRows.map((meter, index) => {
                      const hasAnyReading =
                        meter.displayPower !== null ||
                        meter.displayKwh !== null ||
                        meter.displayAmp !== null;

                      return (
                        <tr
                          key={
                            meter.meter_key ||
                            meter.instance ||
                            `${meter.displayName}-${index}`
                          }
                          className="transition-colors hover:bg-white/[0.025]"
                        >
                          <td className="max-w-[250px] px-4 py-3">
                            <p className="truncate text-xs font-medium text-neutral-200">
                              {meter.displayName}
                            </p>
                            {meter.meter_key && (
                              <p className="mt-1 truncate text-[10px] text-neutral-500">
                                {meter.meter_key}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-400">
                            {meter.displayDepartment}
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular-nums text-white">
                            {formatNumber(meter.displayPower)}
                            <span className="ml-1 text-[10px] text-neutral-500">
                              kW
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular-nums text-white">
                            {formatNumber(meter.displayKwh)}
                            <span className="ml-1 text-[10px] text-neutral-500">
                              kWh
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular-nums text-white">
                            {formatNumber(meter.displayAmp)}
                            <span className="ml-1 text-[10px] text-neutral-500">
                              A
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] ${
                                hasAnyReading
                                  ? "text-emerald-300"
                                  : "text-amber-300"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  hasAnyReading
                                    ? "bg-emerald-400"
                                    : "bg-amber-400"
                                }`}
                              />
                              {hasAnyReading ? "Available" : "Missing"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {!meterRows.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-xs text-neutral-500"
                        >
                          No meters match the current search and department
                          filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1 text-[10px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {meterRows.length} of {meters.length} meters
              </span>
              <span>Unavailable values are not replaced with zero.</span>
            </div>
          </div>
        </Panel>

        {/* Department-wise table and export */}
        <Panel
          title="Department consumption summary"
          subtitle="Power and energy are grouped separately using available meter readings."
          icon={Activity}
          action={
            <button
              type="button"
              onClick={exportDepartmentCsv}
              disabled={!departmentBreakdown.length}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} />
              Export CSV
            </button>
          }
          className="bg-transparent"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Power (kW)
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Meters with power
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Energy (kWh)
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Meters with energy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {departmentBreakdown.map((item) => (
                  <tr key={item.name} className="hover:bg-white/[0.025]">
                    <td className="px-4 py-3 text-xs font-medium text-neutral-200">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-white">
                      {formatNumber(item.power)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-neutral-400">
                      {item.powerCount}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-white">
                      {formatNumber(item.kwh)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-neutral-400">
                      {item.kwhCount}
                    </td>
                  </tr>
                ))}

                {!departmentBreakdown.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-xs text-neutral-500"
                    >
                      No department meter data is available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="px-4 pb-4 pt-2 text-[10px] leading-relaxed text-neutral-500 sm:px-5">
            A missing department value is displayed as unavailable. Department
            totals include only meters with an actual numeric reading.
          </p>
        </Panel>

        {logsError && (
          <div className="flex min-w-0 items-start gap-3 rounded-xl border border-amber-400/20 bg-transparent p-3 sm:p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-200">
                Historical log configuration warning
              </p>
              <p className="mt-1 break-words text-xs leading-relaxed text-neutral-400">
                {logsError}
              </p>
            </div>
          </div>
        )}

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-4 text-[10px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{divisionLabel} · Consumption monitoring</span>
          <span>
            Live meter readings and historical log queries use the existing API.
          </span>
        </footer>
      </div>
    </main>
  );
};

export default ConsumptionPage;

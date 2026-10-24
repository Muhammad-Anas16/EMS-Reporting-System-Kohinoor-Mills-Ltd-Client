import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  FileText,
  Gauge,
  RefreshCw,
  Zap,
  AlertTriangle,
  Wifi,
  TrendingUp,
} from "lucide-react";

import { useBacnetDashboard } from "@/hooks/useBacnetDashboard";
import { summarizeMeters } from "@/services/bacnetService";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/Panel";
import DivisionMetrics from "@/components/division/DivisionMetrics";
import LineChart from "@/components/chart/lineChart";

const UTILITY_OPTIONS = [
  { value: "all", label: "All utilities" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "gas", label: "Gas" },
  { value: "steam", label: "Steam" },
  { value: "compressed_air", label: "Compressed air" },
  { value: "other", label: "Other / unclassified" },
];

const UTILITY_LABELS = {
  electricity: "Electricity",
  water: "Water",
  gas: "Gas",
  steam: "Steam",
  compressed_air: "Compressed air",
  other: "Other / unclassified",
};

const normalizeName = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

const normalizeKey = (value) => normalizeName(value).replace(/\s+/g, "");

const getReading = (meter, field) => {
  const reading = meter?.readings?.[field];
  const candidates = [reading?.liveValue, meter?.live?.[field]];

  for (const candidate of candidates) {
    if (
      candidate !== null &&
      candidate !== undefined &&
      candidate !== "" &&
      Number.isFinite(Number(candidate))
    ) {
      return Number(candidate);
    }
  }

  return null;
};

/**
 * Reads the first available numeric value from supported meter data paths.
 * Demand and power-factor paths depend on the fields returned by the backend.
 */
const getFirstNumericValue = (meter, candidates) => {
  for (const path of candidates) {
    const value = path
      .split(".")
      .reduce((current, key) => current?.[key], meter);

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
};

const getMaximumDemand = (meter) =>
  getFirstNumericValue(meter, [
    "readings.maximumDemand.liveValue",
    "readings.maxDemand.liveValue",
    "readings.demand.liveValue",
    "readings.demandKw.liveValue",
    "readings.demand_kw.liveValue",
    "live.maximumDemand",
    "live.maxDemand",
    "live.demand",
    "live.demandKw",
    "live.demand_kw",
    "maximumDemand",
    "maxDemand",
    "demand",
    "demandKw",
    "demand_kw",
  ]);

const getPowerFactor = (meter) =>
  getFirstNumericValue(meter, [
    "readings.powerFactor.liveValue",
    "readings.power_factor.liveValue",
    "readings.pf.liveValue",
    "live.powerFactor",
    "live.power_factor",
    "live.pf",
    "powerFactor",
    "power_factor",
    "pf",
  ]);

const getConfiguredInstance = (meter, field) => {
  const value = meter?.readings?.[field]?.instance ?? meter?.[field];

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) && number >= 0 ? number : null;
};

const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const formatPowerFactor = (value) => {
  if (value === null || value === undefined) return "—";

  return formatNumber(value);
};

const getCommunicationState = (meter) => {
  const status = getReading(meter, "status");

  if (status === null) return "unknown";

  return status > 0 ? "online" : "offline";
};

const getDemandAlarm = (meter, demandLimit) => {
  const demand = getMaximumDemand(meter);

  if (demand === null) return "unavailable";
  if (!Number.isFinite(demandLimit) || demandLimit <= 0) {
    return "unconfigured";
  }

  return demand >= demandLimit ? "alarm" : "normal";
};

const getPowerFactorAlarm = (meter, minimumPowerFactor) => {
  const powerFactor = getPowerFactor(meter);

  if (powerFactor === null) return "unavailable";
  if (
    !Number.isFinite(minimumPowerFactor) ||
    minimumPowerFactor <= 0 ||
    minimumPowerFactor > 1
  ) {
    return "unconfigured";
  }

  return powerFactor < minimumPowerFactor ? "alarm" : "normal";
};

const getExplicitUtility = (meter) => {
  const raw = [
    meter?.utility,
    meter?.utility_type,
    meter?.utilityType,
    meter?.resource,
    meter?.energy_type,
    meter?.energyType,
    meter?.category,
    meter?.meter_type,
    meter?.meterType,
  ].find((value) => String(value ?? "").trim());

  if (!raw) return null;

  const value = normalizeName(raw);

  if (/electric|electrical|power|energy|kwh/.test(value)) {
    return "electricity";
  }

  if (/water|flow|litre|liter|m3|gallon/.test(value)) {
    return "water";
  }

  if (/natural gas|gas|fuel/.test(value)) {
    return "gas";
  }

  if (/steam|boiler/.test(value)) {
    return "steam";
  }

  if (/compressed air|air compressor|air/.test(value)) {
    return "compressed_air";
  }

  return "other";
};

const getUtilityInfo = (meter) => {
  const explicitUtility = getExplicitUtility(meter);

  if (explicitUtility) {
    return {
      utility: explicitUtility,
      source: "Configured meter metadata",
      confirmed: true,
    };
  }

  const hasElectricalMapping = ["power", "kwh", "amp"].some(
    (field) => getConfiguredInstance(meter, field) !== null,
  );

  if (hasElectricalMapping) {
    return {
      utility: "electricity",
      source: "Inferred from configured power/kWh/current points",
      confirmed: false,
    };
  }

  return {
    utility: "other",
    source: "No utility metadata or supported electrical points found",
    confirmed: false,
  };
};

const getMeterName = (meter) =>
  meter?.meter_name || meter?.meter_key || "Unnamed meter";

const getStatusClasses = (status) => {
  switch (status) {
    case "normal":
    case "online":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "alarm":
    case "offline":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    case "unknown":
    case "unavailable":
    case "unconfigured":
    default:
      return "border-white/10 bg-white/[0.04] text-neutral-400";
  }
};

const StatusBadge = ({ status, children }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
      status,
    )}`}
  >
    {children || status}
  </span>
);

const downloadCsv = (filename, rows) => {
  if (!rows.length) return;

  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];

  const escapeCell = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    columns.map(escapeCell).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCell(row[column])).join(","),
    ),
  ].join("\r\n");

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

const DepartmentReportPage = () => {
  const { division: divisionParam, department: departmentParam } = useParams();
  const navigate = useNavigate();

  const [utilityFilter, setUtilityFilter] = useState("all");

  // Client-side alarm thresholds. Demand assumes kW; confirm the site meter units.
  const [demandLimit, setDemandLimit] = useState("100");
  const [minimumPowerFactor, setMinimumPowerFactor] = useState("0.90");

  const division = divisionParam || "dyeing";
  const isDepartmentView = Boolean(departmentParam);
  const departmentName = normalizeName(departmentParam);

  const {
    data: dashboardData,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useBacnetDashboard();

  const divisionMeters = useMemo(() => {
    if (!dashboardData) return [];

    const divisionKey = normalizeKey(division);
    const divisions = dashboardData.divisions || {};

    const matchingKey = Object.keys(divisions).find(
      (key) => normalizeKey(key) === divisionKey,
    );

    if (matchingKey && Array.isArray(divisions[matchingKey])) {
      return divisions[matchingKey];
    }

    return (dashboardData.meters || []).filter(
      (meter) => normalizeKey(meter?.division) === divisionKey,
    );
  }, [dashboardData, division]);

  const departmentMeters = useMemo(() => {
    if (!isDepartmentView) return divisionMeters;

    return divisionMeters.filter(
      (meter) =>
        normalizeName(meter?.department || "Unknown department") ===
        departmentName,
    );
  }, [divisionMeters, departmentName, isDepartmentView]);

  const departmentNames = useMemo(
    () =>
      [
        ...new Set(
          divisionMeters.map(
            (meter) => meter?.department || "Unknown department",
          ),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [divisionMeters],
  );

  const actualDepartmentName = useMemo(
    () =>
      departmentNames.find((name) => normalizeName(name) === departmentName) ||
      departmentParam,
    [departmentNames, departmentName, departmentParam],
  );

  const scopedMeters = useMemo(() => {
    const source = departmentMeters.map((meter) => ({
      ...meter,
      _utilityInfo: getUtilityInfo(meter),
    }));

    return utilityFilter === "all"
      ? source
      : source.filter((meter) => meter._utilityInfo.utility === utilityFilter);
  }, [departmentMeters, utilityFilter]);

  const summary = useMemo(() => summarizeMeters(scopedMeters), [scopedMeters]);

  const numericDemandLimit = Number(demandLimit);
  const numericMinimumPowerFactor = Number(minimumPowerFactor);

  const alarmSummary = useMemo(() => {
    const demandAlarms = scopedMeters.filter(
      (meter) => getDemandAlarm(meter, numericDemandLimit) === "alarm",
    );

    const powerFactorAlarms = scopedMeters.filter(
      (meter) =>
        getPowerFactorAlarm(meter, numericMinimumPowerFactor) === "alarm",
    );

    const communicationAlarms = scopedMeters.filter(
      (meter) => getCommunicationState(meter) === "offline",
    );

    const unknownCommunication = scopedMeters.filter(
      (meter) => getCommunicationState(meter) === "unknown",
    );

    const availableDemand = scopedMeters.filter(
      (meter) => getMaximumDemand(meter) !== null,
    );

    const availablePowerFactor = scopedMeters.filter(
      (meter) => getPowerFactor(meter) !== null,
    );

    return {
      demandAlarms: demandAlarms.length,
      powerFactorAlarms: powerFactorAlarms.length,
      communicationAlarms: communicationAlarms.length,
      unknownCommunication: unknownCommunication.length,
      availableDemand: availableDemand.length,
      availablePowerFactor: availablePowerFactor.length,
      totalMeters: scopedMeters.length,
    };
  }, [scopedMeters, numericDemandLimit, numericMinimumPowerFactor]);

  const alarmRows = useMemo(
    () =>
      scopedMeters.map((meter) => {
        const demand = getMaximumDemand(meter);
        const powerFactor = getPowerFactor(meter);
        const communication = getCommunicationState(meter);

        return {
          meter,
          name: getMeterName(meter),
          department: meter?.department || "Unknown department",
          demand,
          demandStatus: getDemandAlarm(meter, numericDemandLimit),
          powerFactor,
          powerFactorStatus: getPowerFactorAlarm(
            meter,
            numericMinimumPowerFactor,
          ),
          communication,
        };
      }),
    [scopedMeters, numericDemandLimit, numericMinimumPowerFactor],
  );

  const departmentUtilityRows = useMemo(() => {
    const source = departmentMeters.map((meter) => ({
      ...meter,
      _utilityInfo: getUtilityInfo(meter),
    }));

    const departments = [
      ...new Set(
        source.map((meter) => meter?.department || "Unknown department"),
      ),
    ].sort((a, b) => a.localeCompare(b));

    return departments
      .flatMap((name) => {
        const inDepartment = source.filter(
          (meter) =>
            normalizeName(meter?.department || "Unknown department") ===
            normalizeName(name),
        );

        return Object.keys(UTILITY_LABELS).map((utility) => {
          const utilityMeters = inDepartment.filter(
            (meter) => meter._utilityInfo.utility === utility,
          );

          const powerValues = utilityMeters
            .map((meter) => getReading(meter, "power"))
            .filter((value) => value !== null);

          const energyValues = utilityMeters
            .map((meter) => getReading(meter, "kwh"))
            .filter((value) => value !== null);

          const currentValues = utilityMeters
            .map((meter) => getReading(meter, "amp"))
            .filter((value) => value !== null);

          return {
            department: name,
            utility,
            utilityLabel: UTILITY_LABELS[utility],
            meterCount: utilityMeters.length,
            availablePowerCount: powerValues.length,
            power: powerValues.reduce((sum, value) => sum + value, 0),
            energy: energyValues.reduce((sum, value) => sum + value, 0),
            current: currentValues.reduce((sum, value) => sum + value, 0),
            hasData:
              powerValues.length + energyValues.length + currentValues.length >
              0,
          };
        });
      })
      .filter((row) => row.meterCount > 0 || row.hasData);
  }, [departmentMeters]);

  const combinedUtilityTotals = useMemo(
    () =>
      Object.keys(UTILITY_LABELS).map((utility) => {
        const utilityMeters = departmentMeters.filter(
          (meter) => getUtilityInfo(meter).utility === utility,
        );

        const power = utilityMeters
          .map((meter) => getReading(meter, "power"))
          .filter((value) => value !== null);

        const energy = utilityMeters
          .map((meter) => getReading(meter, "kwh"))
          .filter((value) => value !== null);

        const current = utilityMeters
          .map((meter) => getReading(meter, "amp"))
          .filter((value) => value !== null);

        return {
          utility,
          label: UTILITY_LABELS[utility],
          meterCount: utilityMeters.length,
          power: power.reduce((sum, value) => sum + value, 0),
          energy: energy.reduce((sum, value) => sum + value, 0),
          current: current.reduce((sum, value) => sum + value, 0),
          powerReadings: power.length,
          energyReadings: energy.length,
          currentReadings: current.length,
        };
      }),
    [departmentMeters],
  );

  const powerChartData = useMemo(
    () =>
      scopedMeters
        .map((meter) => ({
          label: getMeterName(meter),
          value: getReading(meter, "power"),
        }))
        .filter((item) => item.value !== null),
    [scopedMeters],
  );

  const energyChartData = useMemo(
    () =>
      scopedMeters
        .map((meter) => ({
          label: getMeterName(meter),
          value: getReading(meter, "kwh"),
        }))
        .filter((item) => item.value !== null),
    [scopedMeters],
  );

  const currentChartData = useMemo(
    () =>
      scopedMeters
        .map((meter) => ({
          label: getMeterName(meter),
          value: getReading(meter, "amp"),
        }))
        .filter((item) => item.value !== null),
    [scopedMeters],
  );

  const formattedDivision = division.replace(/[-_]+/g, " ");

  const pageTitle = isDepartmentView
    ? `${actualDepartmentName || departmentParam} Report`
    : `${formattedDivision} Division Report`;

  const goToDivision = () => navigate(`/${encodeURIComponent(division)}`);

  const goToDivisionReport = () =>
    navigate(`/${encodeURIComponent(division)}/report`);

  const buildExportRows = (includeCombined = true) => {
    const exportedAt = new Date().toISOString();

    const meterRows = scopedMeters.map((meter) => {
      const utilityInfo = meter._utilityInfo || getUtilityInfo(meter);
      const demand = getMaximumDemand(meter);
      const powerFactor = getPowerFactor(meter);

      return {
        report_type: "meter_detail",
        division: meter?.division || division,
        department: meter?.department || "Unknown department",
        utility: UTILITY_LABELS[utilityInfo.utility] || UTILITY_LABELS.other,
        utility_mapping_source: utilityInfo.source,
        utility_mapping_confirmed: utilityInfo.confirmed
          ? "Yes"
          : "No - verify site register",
        meter_name: getMeterName(meter),
        meter_key: meter?.meter_key || "",
        communication_status: getCommunicationState(meter),
        status: getReading(meter, "status"),
        power_kw: getReading(meter, "power"),
        energy_kwh_live_register: getReading(meter, "kwh"),
        current_amp: getReading(meter, "amp"),
        maximum_demand: demand,
        maximum_demand_unit: "Confirm against site meter configuration",
        demand_threshold: numericDemandLimit,
        demand_alarm_status: getDemandAlarm(meter, numericDemandLimit),
        power_factor: powerFactor,
        minimum_power_factor_threshold: numericMinimumPowerFactor,
        power_factor_alarm_status: getPowerFactorAlarm(
          meter,
          numericMinimumPowerFactor,
        ),
        status_instance: getConfiguredInstance(meter, "status"),
        power_instance: getConfiguredInstance(meter, "power"),
        kwh_instance: getConfiguredInstance(meter, "kwh"),
        amp_instance: getConfiguredInstance(meter, "amp"),
        power_reading_available:
          getReading(meter, "power") !== null ? "Yes" : "No",
        energy_reading_available:
          getReading(meter, "kwh") !== null ? "Yes" : "No",
        current_reading_available:
          getReading(meter, "amp") !== null ? "Yes" : "No",
        maximum_demand_available: demand !== null ? "Yes" : "No",
        power_factor_available: powerFactor !== null ? "Yes" : "No",
        data_received_at: dashboardData?.receivedAt || "",
        exported_at: exportedAt,
      };
    });

    if (!includeCombined) return meterRows;

    const combinedRows = departmentUtilityRows.map((row) => ({
      report_type: "department_utility_total",
      division,
      department: row.department,
      utility: row.utilityLabel,
      meter_count: row.meterCount,
      power_kw_sum_of_available_live_readings: row.power,
      energy_kwh_sum_of_available_live_registers: row.energy,
      current_amp_sum_of_available_live_readings: row.current,
      power_reading_count: row.availablePowerCount,
      note: "Live snapshot totals only; not a date-range historical consumption calculation",
      data_received_at: dashboardData?.receivedAt || "",
      exported_at: exportedAt,
    }));

    const totalsRows = combinedUtilityTotals.map((row) => ({
      report_type: "combined_utility_total",
      division,
      department: "ALL INCLUDED DEPARTMENTS",
      utility: row.label,
      meter_count: row.meterCount,
      power_kw_sum_of_available_live_readings: row.power,
      energy_kwh_sum_of_available_live_registers: row.energy,
      current_amp_sum_of_available_live_readings: row.current,
      power_reading_count: row.powerReadings,
      energy_reading_count: row.energyReadings,
      current_reading_count: row.currentReadings,
      note: "Live snapshot totals only; utility mapping must be confirmed against the site meter register",
      data_received_at: dashboardData?.receivedAt || "",
      exported_at: exportedAt,
    }));

    const alarmExportRows = alarmRows.map((row) => ({
      report_type: "demand_and_alarms",
      division,
      department: row.department,
      meter_name: row.name,
      maximum_demand: row.demand,
      demand_threshold: numericDemandLimit,
      demand_alarm_status: row.demandStatus,
      power_factor: row.powerFactor,
      minimum_power_factor_threshold: numericMinimumPowerFactor,
      power_factor_alarm_status: row.powerFactorStatus,
      communication_status: row.communication,
      data_received_at: dashboardData?.receivedAt || "",
      exported_at: exportedAt,
    }));

    return [...meterRows, ...combinedRows, ...totalsRows, ...alarmExportRows];
  };

  const exportCsv = (includeCombined = true) => {
    const rows = buildExportRows(includeCombined);
    const safeDivision = normalizeKey(division) || "division";

    const safeScope = isDepartmentView
      ? normalizeKey(actualDepartmentName || departmentParam)
      : "all-departments";

    const reportType = includeCombined
      ? "combined-department-utility-report"
      : "department-meter-details";

    downloadCsv(
      `${safeDivision}-${safeScope}-${reportType}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      rows,
    );
  };

  if (isPending) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-black px-4 text-sm text-neutral-400">
        Loading report data...
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-black px-4 text-white">
        <Panel className="w-full max-w-lg">
          <div className="p-6 text-center">
            <h1 className="text-lg font-semibold">Unable to load report</h1>
            <p className="mt-2 break-words text-sm text-neutral-400">
              {error?.message || "BACnet data could not be loaded."}
            </p>
            <Button
              className="mt-4"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Try again
            </Button>
          </div>
        </Panel>
      </main>
    );
  }

  if (isDepartmentView && departmentMeters.length === 0) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#0A0A0A] px-4 text-white">
        <Panel className="w-full max-w-lg">
          <div className="p-6 text-center">
            <h1 className="text-lg font-semibold">Department not found</h1>
            <p className="mt-2 text-sm text-neutral-400">
              No meters were found for “{departmentParam}” in{" "}
              {formattedDivision}.
            </p>
            <Button className="mt-4" onClick={goToDivision}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to division
            </Button>
          </div>
        </Panel>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black font-sans text-white">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-5 px-3 py-5 sm:px-5 lg:px-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              EMS · Reports
            </p>
            <h1 className="mt-2 text-2xl font-semibold capitalize">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Utility-wise department reporting, combined division totals, and
              live demand, power-factor, and communication status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="cursor-pointer border-white/15 bg-transparent text-white"
              onClick={goToDivision}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to division
            </Button>

            {isDepartmentView && (
              <Button
                variant="outline"
                className="cursor-pointer border-white/15 bg-transparent text-white"
                onClick={goToDivisionReport}
              >
                <FileText className="mr-2 h-4 w-4" />
                Full division report
              </Button>
            )}

            <Button
              variant="outline"
              className="cursor-pointer border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
              onClick={() => exportCsv(false)}
              disabled={scopedMeters.length === 0}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Export meter CSV
            </Button>

            <Button
              className="cursor-pointer"
              onClick={() => exportCsv(true)}
              disabled={departmentMeters.length === 0}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Export combined CSV
            </Button>

            <Button
              variant="outline"
              className="cursor-pointer border-white/15 bg-transparent text-white"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </header>

        {isFetching && (
          <p role="status" className="text-xs text-cyan-300">
            Updating live readings...
          </p>
        )}

        <Panel>
          <div className="grid grid-cols-1 gap-4 bg-[#0A0A0A] p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-neutral-500">Division</p>
              <p className="mt-1 font-medium capitalize">{formattedDivision}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Departments in scope</p>
              <p className="mt-1 font-medium tabular-nums">
                {isDepartmentView ? 1 : departmentNames.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Meters in report</p>
              <p className="mt-1 font-medium tabular-nums">
                {scopedMeters.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Last live snapshot</p>
              <p className="mt-1 break-all text-sm font-medium">
                {dashboardData?.receivedAt
                  ? new Date(dashboardData.receivedAt).toLocaleString()
                  : "Not supplied by API"}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-3 bg-[#0A0A0A] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Utility filter</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Filters meter details, charts, and Demand & Alarms. Combined
                department tables retain all utilities.
              </p>
            </div>
            <select
              value={utilityFilter}
              onChange={(event) => setUtilityFilter(event.target.value)}
              className="min-h-10 rounded-md border border-white/15 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            >
              {UTILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </Panel>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">
            Combined electrical KPIs — selected report scope
          </h2>
          <DivisionMetrics summary={summary} meters={scopedMeters} />
          <p className="text-xs text-neutral-500">
            Power (kW), current (A), and kWh values are sums of available live
            meter readings. The kWh total is a sum of live register values, not
            calculated consumption for a date range.
          </p>
        </section>

        {/* Demand & Alarms */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <h2 className="text-base font-semibold">Demand &amp; Alarms</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Threshold checks use available live meter fields. Missing demand
              or power-factor points are reported as unavailable.
            </p>
          </div>

          <Panel>
            <div className="grid grid-cols-1 gap-4 bg-[#0A0A0A] p-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="demand-limit"
                  className="mb-2 block text-sm font-medium"
                >
                  Maximum demand alarm threshold (kW)
                </label>
                <input
                  id="demand-limit"
                  type="number"
                  min="0.01"
                  step="any"
                  value={demandLimit}
                  onChange={(event) => setDemandLimit(event.target.value)}
                  className="min-h-10 w-full rounded-md border border-white/15 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  An alarm is raised when a meter's demand is equal to or above
                  this threshold.
                </p>
              </div>

              <div>
                <label
                  htmlFor="minimum-power-factor"
                  className="mb-2 block text-sm font-medium"
                >
                  Minimum acceptable power factor
                </label>
                <input
                  id="minimum-power-factor"
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={minimumPowerFactor}
                  onChange={(event) =>
                    setMinimumPowerFactor(event.target.value)
                  }
                  className="min-h-10 w-full rounded-md border border-white/15 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Use a value from 0 to 1, for example 0.90. Lower readings
                  trigger a low power-factor alarm.
                </p>
              </div>
            </div>
          </Panel>

          {(!Number.isFinite(numericDemandLimit) ||
            numericDemandLimit <= 0 ||
            !Number.isFinite(numericMinimumPowerFactor) ||
            numericMinimumPowerFactor <= 0 ||
            numericMinimumPowerFactor > 1) && (
            <p
              role="alert"
              className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200"
            >
              Enter a demand threshold greater than zero and a minimum power
              factor greater than zero and no greater than 1. Invalid thresholds
              will not be evaluated.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Panel>
              <div className="bg-[#0A0A0A] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-neutral-400">Demand alarms</p>
                  <TrendingUp className="h-5 w-5 text-amber-300" />
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums">
                  {alarmSummary.demandAlarms}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {alarmSummary.availableDemand} meters with demand readings
                </p>
              </div>
            </Panel>

            <Panel>
              <div className="bg-[#0A0A0A] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-neutral-400">Low PF alarms</p>
                  <Gauge className="h-5 w-5 text-amber-300" />
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums">
                  {alarmSummary.powerFactorAlarms}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {alarmSummary.availablePowerFactor} meters with PF readings
                </p>
              </div>
            </Panel>

            <Panel>
              <div className="bg-[#0A0A0A] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-neutral-400">
                    Communication alarms
                  </p>
                  <Wifi className="h-5 w-5 text-red-300" />
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums">
                  {alarmSummary.communicationAlarms}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Meters whose numeric status is zero or below
                </p>
              </div>
            </Panel>

            <Panel>
              <div className="bg-[#0A0A0A] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-neutral-400">
                    Unknown communication
                  </p>
                  <Activity className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums">
                  {alarmSummary.unknownCommunication}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Meters without a usable numeric status reading
                </p>
              </div>
            </Panel>
          </div>

          <Panel>
            <div className="overflow-x-auto bg-[#0A0A0A]">
              <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-neutral-400">
                  <tr>
                    {[
                      "Meter",
                      "Department",
                      "Maximum demand",
                      "Demand status",
                      "Power factor",
                      "PF status",
                      "Communication",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-3 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alarmRows.map((row, index) => (
                    <tr
                      key={`${row.meter?.meter_key || row.name}-${index}`}
                      className="border-t border-white/10 hover:bg-white/[0.025]"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 capitalize">
                        {row.department}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                        {row.demand === null
                          ? "—"
                          : `${formatNumber(row.demand)} kW`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.demandStatus}>
                          {row.demandStatus === "unavailable"
                            ? "No reading"
                            : row.demandStatus}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                        {formatPowerFactor(row.powerFactor)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.powerFactorStatus}>
                          {row.powerFactorStatus === "unavailable"
                            ? "No reading"
                            : row.powerFactorStatus}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.communication}>
                          {row.communication}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}

                  {alarmRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-neutral-500"
                      >
                        No meters match the selected utility.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <p className="text-xs leading-5 text-neutral-500">
            Alarm evaluation is performed in this page using the current
            readings. Communication status assumes the existing numeric status
            point reports a positive value when online. Confirm the status
            point's actual meaning and the demand unit with your BACnet meter
            configuration. This page does not create server-side alarms or
            historical alarm events.
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">
              Combined department and utility report
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              One row per department and detected utility, followed by
              per-utility combined totals. Unavailable readings are indicated by
              their reading counts.
            </p>
          </div>

          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse bg-[#0A0A0A] text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-neutral-400">
                  <tr>
                    {[
                      "Department",
                      "Utility",
                      "Meters",
                      "Power (kW)",
                      "Energy register (kWh)",
                      "Current (A)",
                      "Power readings",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-3 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {departmentUtilityRows.map((row) => (
                    <tr
                      key={`${row.department}-${row.utility}`}
                      className="border-t border-white/10 hover:bg-white/[0.025]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 capitalize">
                        {row.department}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.utilityLabel}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {row.meterCount}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatNumber(row.power)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatNumber(row.energy)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatNumber(row.current)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {row.availablePowerCount}
                      </td>
                    </tr>
                  ))}

                  {departmentUtilityRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-neutral-500"
                      >
                        No department utility mapping is available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Combined utility totals</h2>
            <p className="mt-1 text-xs text-neutral-500">
              All departments currently in scope, grouped by utility.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {combinedUtilityTotals.map((row) => (
              <Panel key={row.utility}>
                <div className="bg-[#0A0A0A] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{row.label}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-neutral-400">
                      {row.meterCount} meters
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[11px] text-neutral-500">Power</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {formatNumber(row.power)}{" "}
                        <span className="text-[10px] font-normal text-neutral-500">
                          kW
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">
                        Energy register
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {formatNumber(row.energy)}{" "}
                        <span className="text-[10px] font-normal text-neutral-500">
                          kWh
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Current</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {formatNumber(row.current)}{" "}
                        <span className="text-[10px] font-normal text-neutral-500">
                          A
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-neutral-500">
                    Available readings — power: {row.powerReadings}, energy:{" "}
                    {row.energyReadings}, current: {row.currentReadings}
                  </p>
                </div>
              </Panel>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Live meter charts</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Charts follow the selected utility filter and use live values
              only.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <Panel className="min-w-0">
              <div className="h-full min-w-0 bg-[#0A0A0A] p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
                    <Zap aria-hidden="true" className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Power readings</h3>
                    <p className="text-xs text-neutral-500">
                      Available live power values (kW)
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <LineChart
                    data={powerChartData}
                    ariaLabel="Power readings by meter"
                    lineColor="#22D3EE"
                    height={280}
                    emptyMessage="No live power readings available for this utility filter"
                    valueFormatter={formatNumber}
                  />
                </div>
              </div>
            </Panel>

            <Panel className="min-w-0">
              <div className="h-full min-w-0 bg-[#0A0A0A] p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-400/10">
                    <Activity
                      aria-hidden="true"
                      className="h-5 w-5 text-blue-300"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">
                      Energy register readings
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Available live kWh register values
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <LineChart
                    data={energyChartData}
                    ariaLabel="Energy readings by meter"
                    lineColor="#60A5FA"
                    height={280}
                    emptyMessage="No live kWh readings available for this utility filter"
                    valueFormatter={formatNumber}
                  />
                </div>
              </div>
            </Panel>

            <Panel className="min-w-0 md:col-span-2 2xl:col-span-1">
              <div className="h-full min-w-0 bg-[#0A0A0A] p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                    <Gauge
                      aria-hidden="true"
                      className="h-5 w-5 text-emerald-300"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Current readings</h3>
                    <p className="text-xs text-neutral-500">
                      Available live current values (A)
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <LineChart
                    data={currentChartData}
                    ariaLabel="Current readings by meter"
                    lineColor="#34D399"
                    height={280}
                    emptyMessage="No live current readings available for this utility filter"
                    valueFormatter={formatNumber}
                  />
                </div>
              </div>
            </Panel>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">
              Meter-wise utility mapping and readings
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              BACnet instance IDs are configuration references, not readings.
              Utility labels inferred from electrical fields should be checked
              against the site meter register.
            </p>
          </div>

          <Panel>
            <div className="overflow-x-auto bg-[#0A0A0A]">
              <table className="w-full min-w-screen border-collapse text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-neutral-400">
                  <tr>
                    {[
                      "Meter",
                      "Department",
                      "Utility",
                      "Mapping source",
                      "Status",
                      "Power (kW)",
                      "Energy register (kWh)",
                      "Current (A)",
                      "Point IDs (power / kWh / amp)",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-3 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scopedMeters.map((meter, index) => {
                    const info = meter._utilityInfo || getUtilityInfo(meter);
                    const status = getReading(meter, "status");

                    return (
                      <tr
                        key={`${meter?.meter_key || meter?.meter_name || "meter"}-${index}`}
                        className="border-t border-white/10 hover:bg-white/[0.025]"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          {getMeterName(meter)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 capitalize">
                          {meter?.department || "Unknown department"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {UTILITY_LABELS[info.utility]}
                        </td>
                        <td className="max-w-[240px] px-4 py-3 text-xs text-neutral-400">
                          {info.source}
                          {!info.confirmed ? " · verify" : ""}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {status === null
                            ? "Unavailable"
                            : status > 0
                              ? "Online"
                              : "Offline"}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(getReading(meter, "power"))}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(getReading(meter, "kwh"))}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(getReading(meter, "amp"))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-neutral-400">
                          {getConfiguredInstance(meter, "power") ?? "—"} /{" "}
                          {getConfiguredInstance(meter, "kwh") ?? "—"} /{" "}
                          {getConfiguredInstance(meter, "amp") ?? "—"}
                        </td>
                      </tr>
                    );
                  })}

                  {scopedMeters.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-neutral-500"
                      >
                        No meters match the selected utility.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <p className="text-xs leading-5 text-neutral-500">
          Data limitation: this page reports the current live BACnet snapshot.
          The available frontend data does not establish historical samples for
          water, gas, steam, or date-wise consumption. Utility totals depend on
          correct meter metadata and configured live points. Demand and
          power-factor values require matching fields in the backend response.
          No missing utility or alarm readings are fabricated.
        </p>
      </div>
    </main>
  );
};

export default DepartmentReportPage;

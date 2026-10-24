import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import ReadingValue from "@/components/common/ReadingValue";
import {
  Search,
  Wifi,
  WifiOff,
  CircleHelp,
  RotateCcw,
  Zap,
  Activity,
  Gauge,
  Radio,
} from "lucide-react";

const UTILITY_CONFIG = {
  power: {
    label: "Power",
    description: "Power readings",
    icon: Zap,
    field: "power",
    unit: "W",
  },
  energy: {
    label: "Energy",
    description: "Energy readings",
    icon: Activity,
    field: "kwh",
    unit: "kWh",
  },
  current: {
    label: "Current",
    description: "Current readings",
    icon: Gauge,
    field: "amp",
    unit: "A",
  },
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

const getReading = (meter, field) => {
  const reading = meter?.readings?.[field];

  // Do not fall back to meter[field]:
  // those fields may contain BACnet instance IDs, not live readings.
  if (
    reading?.hasLiveValue === true &&
    reading.liveValue !== null &&
    reading.liveValue !== undefined &&
    reading.liveValue !== ""
  ) {
    return reading.liveValue;
  }

  if (
    reading?.liveValue !== null &&
    reading?.liveValue !== undefined &&
    reading?.liveValue !== ""
  ) {
    return reading.liveValue;
  }

  // Support data sources that provide live values directly.
  const liveValue = meter?.live?.[field];

  if (liveValue !== null && liveValue !== undefined && liveValue !== "") {
    return liveValue;
  }

  return null;
};

const hasReading = (meter, field) => {
  const value = getReading(meter, field);

  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
};

const getStatus = (meter) => {
  const value = getReading(meter, "status");

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "Unavailable";
  }

  return Number(value) > 0 ? "Positive status" : "Zero / negative";
};

const getStatusStyle = (meterStatus) => {
  switch (meterStatus) {
    case "Positive status":
      return {
        text: "text-emerald-300",
        background: "bg-emerald-400/10",
        icon: Wifi,
      };

    case "Zero / negative":
      return {
        text: "text-amber-300",
        background: "bg-amber-400/10",
        icon: WifiOff,
      };

    default:
      return {
        text: "text-neutral-400",
        background: "bg-white/[0.05]",
        icon: CircleHelp,
      };
  }
};

const getUtilityFromParams = (value) => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();

  // Accept common names and aliases.
  if (["power", "electricity", "watt", "watts"].includes(normalized)) {
    return "power";
  }

  if (["energy", "kwh", "kw-h", "consumption"].includes(normalized)) {
    return "energy";
  }

  if (["current", "amp", "amps", "amperage"].includes(normalized)) {
    return "current";
  }

  return null;
};

const DivisionMeterTable = ({ meters = [], receivedAt }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const utilityParam = searchParams.get("utility");
  const activeUtility = getUtilityFromParams(utilityParam);
  const utilityConfig = activeUtility ? UTILITY_CONFIG[activeUtility] : null;

  const safeMeters = Array.isArray(meters) ? meters : [];

  const departments = useMemo(() => {
    return [
      ...new Set(safeMeters.map((meter) => meter?.department || "Unknown")),
    ].sort((a, b) => a.localeCompare(b));
  }, [safeMeters]);

  const utilityMeters = useMemo(() => {
    if (!utilityConfig) return safeMeters;

    return safeMeters.filter((meter) => hasReading(meter, utilityConfig.field));
  }, [safeMeters, utilityConfig]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return utilityMeters.filter((meter) => {
      const searchableText = [
        meter?.meter_name,
        meter?.meter_key,
        meter?.department,
        meter?.division,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const meterStatus = getStatus(meter);

      const matchesSearch = !query || searchableText.includes(query);

      const matchesDepartment =
        department === "all" || (meter?.department || "Unknown") === department;

      const matchesStatus =
        status === "all" ||
        (status === "positive" && meterStatus === "Positive status") ||
        (status === "inactive" && meterStatus === "Zero / negative") ||
        (status === "missing" && meterStatus === "Unavailable");

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [utilityMeters, search, department, status]);

  const formattedReceivedAt = useMemo(() => {
    if (!receivedAt) return "Not available";

    const date = new Date(receivedAt);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString();
  }, [receivedAt]);

  const resetFilters = () => {
    setSearch("");
    setDepartment("all");
    setStatus("all");
  };

  const clearUtilityFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("utility");
    setSearchParams(nextParams);
    resetFilters();
  };

  const hasActiveFilters =
    search.trim() !== "" || department !== "all" || status !== "all";

  const UtilityIcon = utilityConfig?.icon || Radio;

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Meter Readings</h2>

            {utilityConfig && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                <UtilityIcon aria-hidden="true" className="h-3.5 w-3.5" />
                {utilityConfig.label}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            Search and review meter readings by department and status.
          </p>
        </div>

        {utilityConfig && (
          <button
            type="button"
            onClick={clearUtilityFilter}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            All utilities
          </button>
        )}
      </div>

      {/* Utility summary */}
      {utilityConfig && (
        <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/10">
              <UtilityIcon
                aria-hidden="true"
                className="h-5 w-5 text-cyan-300"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {utilityConfig.label} meters
              </p>

              <p className="mt-0.5 text-xs text-neutral-500">
                Showing meters with an available{" "}
                {utilityConfig.label.toLowerCase()} reading.
              </p>
            </div>

            <div className="ml-auto text-right">
              <p className="text-xl font-semibold tabular-nums text-white">
                {utilityMeters.length}
              </p>
              <p className="text-[11px] text-neutral-500">meters</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <div className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search meter, key, department..."
            aria-label="Search meters"
            className="h-10 w-full rounded-lg border border-white/10 bg-neutral-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
          />
        </div>

        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          aria-label="Filter by department"
          className="h-10 min-w-0 rounded-lg border border-white/10 bg-neutral-950 px-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/50"
        >
          <option value="all">All departments</option>

          {departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
          className="h-10 min-w-0 rounded-lg border border-white/10 bg-neutral-950 px-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/50"
        >
          <option value="all">All status readings</option>
          <option value="positive">Positive status</option>
          <option value="inactive">Zero / negative</option>
          <option value="missing">Unavailable status</option>
        </select>
      </div>

      {/* Result count and reset */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          Showing{" "}
          <span className="font-medium text-neutral-300">{rows.length}</span> of{" "}
          <span className="font-medium text-neutral-300">
            {utilityMeters.length}
          </span>{" "}
          {utilityConfig
            ? `${utilityConfig.label.toLowerCase()} meters`
            : "meters"}
          {utilityConfig && safeMeters.length !== utilityMeters.length
            ? ` (${safeMeters.length} total)`
            : ""}
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Meter table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-neutral-500">
            <tr>
              {[
                "Meter",
                "Department",
                "Power",
                "Energy (kWh)",
                "Current",
                "Status reading",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 font-medium sm:px-4"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((meter, index) => {
              const meterStatus = getStatus(meter);
              const statusStyle = getStatusStyle(meterStatus);
              const StatusIcon = statusStyle.icon;

              const meterName =
                meter?.meter_name || meter?.meter_key || "Unnamed meter";

              return (
                <tr
                  key={`${meter?.meter_key || meterName}-${index}`}
                  className="border-t border-white/[0.07] transition-colors hover:bg-white/[0.025]"
                >
                  <td className="max-w-[240px] px-3 py-3 sm:px-4">
                    <p
                      className="truncate font-medium text-white"
                      title={meterName}
                    >
                      {meterName}
                    </p>

                    <p
                      className="mt-1 truncate text-[11px] text-neutral-600"
                      title={meter?.meter_key || ""}
                    >
                      {meter?.meter_key || "—"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 text-neutral-400 sm:px-4">
                    {meter?.department || "Unknown"}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-neutral-200 sm:px-4">
                    <ReadingValue value={getReading(meter, "power")} reading={meter?.readings?.power} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-neutral-200 sm:px-4">
                    <ReadingValue value={getReading(meter, "kwh")} reading={meter?.readings?.kwh} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-neutral-200 sm:px-4">
                    <ReadingValue value={getReading(meter, "amp")} reading={meter?.readings?.amp} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${statusStyle.text} ${statusStyle.background}`}
                      title={`Raw status: ${formatNumber(
                        getReading(meter, "status"),
                      )}`}
                    >
                      <StatusIcon
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      {meterStatus}
                    </span>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search
                      aria-hidden="true"
                      className="h-5 w-5 text-neutral-600"
                    />

                    <p className="text-sm font-medium text-neutral-300">
                      No meters found
                    </p>

                    <p className="max-w-sm text-xs text-neutral-500">
                      {utilityConfig
                        ? `No meters with available ${utilityConfig.label.toLowerCase()} readings match the selected filters.`
                        : "No meters match your search or selected filters."}
                    </p>

                    {(hasActiveFilters || utilityConfig) && (
                      <button
                        type="button"
                        onClick={() => {
                          resetFilters();

                          if (utilityConfig) {
                            clearUtilityFilter();
                          }
                        }}
                        className="mt-1 text-xs font-medium text-cyan-300 hover:text-cyan-200"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col justify-between gap-2 text-xs text-neutral-600 sm:flex-row sm:items-center">
        <span>Last successful read: {formattedReceivedAt}</span>

        <span>Status labels describe the raw status value only.</span>
      </div>
    </div>
  );
};

export default DivisionMeterTable;

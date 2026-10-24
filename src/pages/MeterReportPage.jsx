import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
  RefreshCw,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

import { useBacnetDashboard } from "@/hooks/useBacnetDashboard";
import { summarizeMeters } from "@/services/bacnetService";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/Panel";
import { MetricCard } from "@/components/dashboard/MetricCard";

import DivisionMeterTable from "@/components/division/DivisionMeterTable";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, "all"];

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

const getReading = (meter, field) => {
  const value = meter?.readings?.[field]?.liveValue;

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

const getMeterName = (meter) =>
  String(
    meter?.name ??
      meter?.meterName ??
      meter?.deviceName ??
      meter?.displayName ??
      meter?.id ??
      "Unnamed meter",
  );

const getMeterStatus = (meter) => {
  const status = getReading(meter, "status");

  if (status !== null) {
    return status > 0 ? "online" : "offline";
  }

  const hasReading = ["power", "kwh", "amp"].some(
    (field) => getReading(meter, field) !== null,
  );

  return hasReading ? "unknown" : "unavailable";
};

const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

const getMeterInstance = (meter, field) => {
  const instance = meter?.readings?.[field]?.instance ?? meter?.[field];
  if (instance === null || instance === undefined || instance === "")
    return null;
  const numeric = Number(instance);
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
};

const getUtilityMapping = (meter) => {
  const explicitUtility =
    meter?.utility ??
    meter?.utilityType ??
    meter?.utility_type ??
    meter?.category;
  const configuredFields = ["power", "kwh", "amp"].filter(
    (field) => getMeterInstance(meter, field) !== null,
  );

  if (explicitUtility && String(explicitUtility).trim()) {
    return {
      label: String(explicitUtility).trim(),
      fields: configuredFields,
      configured: configuredFields.length > 0,
      source: "Configured utility label",
    };
  }

  if (configuredFields.length > 0) {
    return {
      label: "Electrical (inferred from power / kWh / current fields)",
      fields: configuredFields,
      configured: true,
      source:
        "Inferred from configured BACnet fields; confirm against site meter register",
    };
  }

  return {
    label: "Unmapped",
    fields: [],
    configured: false,
    source: "No utility label or recognized electrical field instances",
  };
};

const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename, rows) => {
  if (!rows.length) return false;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => csvCell(row[header])).join(","),
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
};

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MeterReportPage = () => {
  const { division: divisionParam = "dyeing" } = useParams();
  const navigate = useNavigate();

  const divisionName = normalize(divisionParam).replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );

  const divisionKey = normalize(divisionParam);

  const {
    data: dashboardData,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useBacnetDashboard();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return getDateString(date);
  });
  const [endDate, setEndDate] = useState(() => getDateString(new Date()));

  // Get the complete meter list for the current division.
  const meters = useMemo(() => {
    if (!dashboardData) return [];

    const divisions = dashboardData.divisions || {};

    const matchingKey = Object.keys(divisions).find(
      (key) => normalize(key) === divisionKey,
    );

    if (matchingKey && Array.isArray(divisions[matchingKey])) {
      return divisions[matchingKey];
    }

    return (dashboardData.meters || []).filter(
      (meter) => normalize(meter?.division) === divisionKey,
    );
  }, [dashboardData, divisionKey]);

  // Available departments.
  const departments = useMemo(
    () =>
      [
        ...new Set(
          meters
            .map((meter) => String(meter?.department ?? "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [meters],
  );

  // Search + department + status filters.
  const filteredMeters = useMemo(() => {
    const query = normalize(search);

    return meters.filter((meter) => {
      const searchableText = normalize(
        [
          getMeterName(meter),
          meter?.division,
          meter?.department,
          meter?.name,
          meter?.meterName,
          meter?.deviceName,
          meter?.displayName,
          meter?.deviceId,
          meter?.id,
          meter?.description,
        ]
          .filter(Boolean)
          .join(" "),
      );

      const matchesSearch = !query || searchableText.includes(query);

      const matchesDepartment =
        departmentFilter === "all" ||
        normalize(meter?.department) === normalize(departmentFilter);

      const status = getMeterStatus(meter);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [meters, search, departmentFilter, statusFilter]);

  // Consumption totals for the filtered meter list.
  const summary = useMemo(
    () => summarizeMeters(filteredMeters),
    [filteredMeters],
  );

  const onlineCount = useMemo(
    () =>
      filteredMeters.filter((meter) => getMeterStatus(meter) === "online")
        .length,
    [filteredMeters],
  );

  const mappingSummary = useMemo(() => {
    const mappings = filteredMeters.map((meter) => ({
      meter,
      mapping: getUtilityMapping(meter),
    }));
    const mapped = mappings.filter(({ mapping }) => mapping.configured).length;
    const missing = mappings.length - mapped;
    const fieldsWithReadings = mappings.reduce(
      (count, { meter, mapping }) =>
        count +
        mapping.fields.filter((field) => getReading(meter, field) !== null)
          .length,
      0,
    );
    return { mapped, missing, fieldsWithReadings, total: mappings.length };
  }, [filteredMeters]);

  const dateRangeInvalid = !startDate || !endDate || startDate > endDate;

  const exportCsv = () => {
    if (dateRangeInvalid || filteredMeters.length === 0) return;

    const exportedAt = new Date().toISOString();
    const rows = filteredMeters.map((meter) => {
      const mapping = getUtilityMapping(meter);
      return {
        report_division: divisionName,
        report_start_date: startDate,
        report_end_date: endDate,
        report_data_type:
          "Live BACnet snapshot; selected dates are report metadata, not historical filtering",
        exported_at: exportedAt,
        meter_name: getMeterName(meter),
        meter_key: meter?.meter_key ?? "",
        meter_id: meter?.id ?? meter?.deviceId ?? meter?.device_id ?? "",
        division: meter?.division ?? divisionName,
        department: meter?.department ?? "Unknown",
        utility_mapping: mapping.label,
        mapping_source: mapping.source,
        mapping_complete: mapping.configured ? "yes" : "no",
        status_instance: getMeterInstance(meter, "status") ?? "",
        status_value: getReading(meter, "status") ?? "",
        power_instance: getMeterInstance(meter, "power") ?? "",
        power_live_value: getReading(meter, "power") ?? "",
        power_unit: "kW (as labelled in current report)",
        kwh_instance: getMeterInstance(meter, "kwh") ?? "",
        kwh_live_value: getReading(meter, "kwh") ?? "",
        energy_unit: "kWh",
        current_instance: getMeterInstance(meter, "amp") ?? "",
        current_live_value: getReading(meter, "amp") ?? "",
        current_unit: "A",
        meter_status: getMeterStatus(meter),
        received_at: dashboardData?.receivedAt ?? "",
      };
    });

    const safeDivision = normalize(divisionParam).replace(/[^a-z0-9]+/g, "-");
    downloadCsv(
      `meter-report-${safeDivision}-${startDate}-to-${endDate}.csv`,
      rows,
    );
  };

  const unavailableCount = useMemo(
    () =>
      filteredMeters.filter((meter) =>
        ["unavailable", "unknown"].includes(getMeterStatus(meter)),
      ).length,
    [filteredMeters],
  );

  const numericPageSize = pageSize === "all" ? Infinity : Number(pageSize);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMeters.length / numericPageSize),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedMeters = useMemo(() => {
    if (pageSize === "all") {
      return filteredMeters;
    }

    const size = Number(pageSize);
    const startIndex = (safeCurrentPage - 1) * size;

    return filteredMeters.slice(startIndex, startIndex + size);
  }, [filteredMeters, pageSize, safeCurrentPage]);

  // Reset pagination when the filters or page size change.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter, statusFilter, pageSize]);

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setPageSize("10");
    setCurrentPage(1);
  };

  const firstItem =
    filteredMeters.length === 0
      ? 0
      : pageSize === "all"
        ? 1
        : (safeCurrentPage - 1) * Number(pageSize) + 1;

  const lastItem =
    pageSize === "all"
      ? filteredMeters.length
      : Math.min(safeCurrentPage * Number(pageSize), filteredMeters.length);

  const getPageNumbers = () => {
    const pages = [];

    for (let page = 1; page <= totalPages; page += 1) {
      if (
        page === 1 ||
        page === totalPages ||
        Math.abs(page - safeCurrentPage) <= 1
      ) {
        pages.push(page);
      } else if (pages[pages.length - 1] !== "ellipsis") {
        pages.push("ellipsis");
      }
    }

    return pages;
  };

  if (isPending) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-24 rounded-2xl bg-neutral-900" />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-2xl bg-neutral-900" />
            ))}
          </div>

          <div className="h-72 rounded-2xl bg-neutral-900" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <Panel className="w-full max-w-lg">
          <div className="p-6 text-center">
            <WifiOff className="mx-auto h-9 w-9 text-red-300" />

            <h1 className="mt-4 text-lg font-semibold">
              Unable to load meter readings
            </h1>

            <p className="mt-2 text-sm text-neutral-400">
              {error?.message || "Could not load division meter data."}
            </p>

            <Button
              className="mt-5"
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-5 px-3 py-5 sm:px-5 lg:px-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              {divisionName} Division
            </p>

            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Department Meter Report
            </h1>

            <p className="mt-2 text-xs leading-5 text-neutral-400">
              Search all division meters, filter departments and statuses, and
              browse results with pagination.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/${encodeURIComponent(divisionParam)}`)}
              className="border-white/15 bg-neutral-950 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Division Dashboard
            </Button>

            <Button
              onClick={exportCsv}
              disabled={dateRangeInvalid || filteredMeters.length === 0}
              className="bg-emerald-700 text-white hover:bg-emerald-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Building2}
            label="Matching Meters"
            value={filteredMeters.length}
            detail={`${meters.length} total meters in this division`}
            accent="cyan"
          />

          <MetricCard
            icon={Wifi}
            label="Positive Status"
            value={onlineCount}
            detail="Meters reporting a positive status value"
            accent="green"
          />

          <MetricCard
            icon={WifiOff}
            label="Unavailable / Unknown"
            value={unavailableCount}
            detail="Meters without recognized status or readings"
            accent="amber"
          />

          <MetricCard
            icon={Zap}
            label="Filtered Power Total"
            value={
              filteredMeters.some(
                (meter) => getReading(meter, "power") !== null,
              )
                ? formatNumber(summary.totalPower)
                : "—"
            }
            detail="Available power readings · kW"
            accent="blue"
          />
        </section>

        {/* Report date range */}
        <Panel>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              <div>
                <h2 className="text-sm font-semibold">Report Date Range</h2>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  Select the reporting period for the CSV export. The current
                  meter endpoint supplies live BACnet snapshots only; it does
                  not return historical meter samples, so these dates do not
                  change the live readings shown below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <label className="block">
                <span className="mb-1.5 block text-xs text-neutral-400">
                  Start date
                </span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-cyan-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs text-neutral-400">
                  End date
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-cyan-400/50"
                />
              </label>

              <Button
                onClick={exportCsv}
                disabled={dateRangeInvalid || filteredMeters.length === 0}
                className="h-11 bg-emerald-700 text-white hover:bg-emerald-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Export filtered meters
              </Button>
            </div>

            {dateRangeInvalid && (
              <p role="alert" className="text-xs text-amber-300">
                Select a valid date range. Start date must be on or before end
                date.
              </p>
            )}
          </div>
        </Panel>

        {/* Utility and BACnet mapping verification */}
        <Panel>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-sm font-semibold">
                  Meter-wise Consumption & Utility Mapping
                </h2>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  Mapping is checked against the configured BACnet instance IDs
                  for status, power, kWh and current, and the corresponding live
                  readings. A configured instance is not proof of the physical
                  meter wiring; confirm the utility label against your site
                  register.
                </p>
              </div>
              <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-300">
                {mappingSummary.mapped} mapped · {mappingSummary.missing}{" "}
                unmapped
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-xs text-neutral-500">
                  Meters with configured electrical fields
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {mappingSummary.mapped}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-xs text-neutral-500">
                  Meters without recognized mapping
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {mappingSummary.missing}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-xs text-neutral-500">
                  Available mapped live values
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {mappingSummary.fieldsWithReadings}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full min-w-[950px] text-left text-xs">
                <thead className="bg-white/[0.04] text-neutral-400">
                  <tr>
                    <th className="px-3 py-3 font-medium">Meter</th>
                    <th className="px-3 py-3 font-medium">Department</th>
                    <th className="px-3 py-3 font-medium">Utility mapping</th>
                    <th className="px-3 py-3 font-medium">
                      Power instance / live
                    </th>
                    <th className="px-3 py-3 font-medium">
                      kWh instance / live
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Current instance / live
                    </th>
                    <th className="px-3 py-3 font-medium">Mapping status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredMeters.slice(0, 100).map((meter, index) => {
                    const mapping = getUtilityMapping(meter);
                    const powerInstance = getMeterInstance(meter, "power");
                    const kwhInstance = getMeterInstance(meter, "kwh");
                    const ampInstance = getMeterInstance(meter, "amp");
                    const complete =
                      powerInstance !== null &&
                      kwhInstance !== null &&
                      ampInstance !== null;
                    return (
                      <tr
                        key={`${meter?.meter_key ?? getMeterName(meter)}-${index}`}
                        className="text-neutral-300"
                      >
                        <td className="px-3 py-3 font-medium text-white">
                          {getMeterName(meter)}
                        </td>
                        <td className="px-3 py-3">
                          {meter?.department || "Unknown"}
                        </td>
                        <td className="px-3 py-3">
                          <span className="block">{mapping.label}</span>
                          <span className="mt-1 block max-w-xs text-[10px] text-neutral-500">
                            {mapping.source}
                          </span>
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {powerInstance ?? "—"} /{" "}
                          {formatNumber(getReading(meter, "power"))} kW
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {kwhInstance ?? "—"} /{" "}
                          {formatNumber(getReading(meter, "kwh"))} kWh
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          {ampInstance ?? "—"} /{" "}
                          {formatNumber(getReading(meter, "amp"))} A
                        </td>
                        <td className="px-3 py-3">
                          {complete ? (
                            <span className="inline-flex items-center gap-1 text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" /> IDs
                              configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-300">
                              <AlertTriangle className="h-3.5 w-3.5" /> Partial
                              mapping
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMeters.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-neutral-500"
                      >
                        No meters match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredMeters.length > 100 && (
              <p className="text-[10px] text-neutral-500">
                Showing the first 100 mapping rows for readability. CSV export
                includes all filtered meters.
              </p>
            )}
          </div>
        </Panel>

        {/* Search and filters */}
        <Panel>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" />

              <h2 className="text-sm font-semibold">Search & Filters</h2>

              <span className="ml-auto text-xs text-neutral-500">
                {filteredMeters.length} result(s)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search meter, ID, department..."
                  aria-label="Search meters"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black pl-10 pr-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-cyan-400/50"
                />
              </div>

              {/* Department */}
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger
                  aria-label="Filter by department"
                  className="h-11 border-white/10 bg-black text-white"
                >
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>

                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  aria-label="Filter by meter status"
                  className="h-11 border-white/10 bg-black text-white"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="online">Positive status</SelectItem>
                  <SelectItem value="offline">Offline / zero status</SelectItem>
                  <SelectItem value="unavailable">No readings</SelectItem>
                  <SelectItem value="unknown">Status unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
              <p className="text-xs text-neutral-500">
                Filters apply to the complete division meter list.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="border-white/15 bg-transparent text-white hover:bg-white/10"
              >
                Clear filters
              </Button>
            </div>
          </div>
        </Panel>

        {/* Meter results and page size */}
        <section className="space-y-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-base font-semibold text-white">
                Meter Results
              </h2>

              <p className="mt-1 text-xs text-neutral-500">
                Showing {firstItem}–{lastItem} of {filteredMeters.length} meters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs text-neutral-400">
                Meters per page
              </span>

              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger
                  aria-label="Meters per page"
                  className="h-9 w-[135px] border-white/10 bg-neutral-950 text-white"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option === "all" ? "All meters" : `${option} meters`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {paginatedMeters.length > 0 ? (
            <DivisionMeterTable
              meters={paginatedMeters}
              receivedAt={dashboardData?.receivedAt}
            />
          ) : (
            <Panel>
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <FileSearch className="h-9 w-9 text-neutral-600" />

                <h3 className="mt-3 text-sm font-semibold text-white">
                  No matching meters
                </h3>

                <p className="mt-1 max-w-md text-xs leading-5 text-neutral-500">
                  Try a different search term or clear your filters.
                </p>

                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="mt-4 border-white/15 bg-transparent text-white hover:bg-white/10"
                >
                  Clear filters
                </Button>
              </div>
            </Panel>
          )}

          {/* Pagination */}
          {filteredMeters.length > 0 && pageSize !== "all" && (
            <Panel>
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="text-xs text-neutral-400">
                  Page {safeCurrentPage} of {totalPages}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="border-white/15 bg-neutral-950 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((item, index) =>
                      item === "ellipsis" ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1 text-xs text-neutral-500"
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={item}
                          size="sm"
                          variant={
                            item === safeCurrentPage ? "default" : "outline"
                          }
                          onClick={() => setCurrentPage(item)}
                          aria-label={`Go to page ${item}`}
                          aria-current={
                            item === safeCurrentPage ? "page" : undefined
                          }
                          className={
                            item === safeCurrentPage
                              ? "min-w-9"
                              : "min-w-9 border-white/15 bg-neutral-950 text-white hover:bg-white/10"
                          }
                        >
                          {item}
                        </Button>
                      ),
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    className="border-white/15 bg-neutral-950 text-white hover:bg-white/10"
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Panel>
          )}
        </section>
      </div>
    </main>
  );
};

export default MeterReportPage;

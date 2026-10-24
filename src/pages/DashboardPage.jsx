import { useMemo, useState } from "react";
import {
  Activity,
  Gauge,
  RefreshCw,
  Wifi,
  Zap,
  AlertCircle,
  Clock3,
  Droplets,
  Wind,
  Flame,
  Waves,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { logout, selectAuth } from "@/redux/features/auth/authSlice";
import { useBacnetDashboard } from "@/hooks/useBacnetDashboard";
import { summarizeMeters } from "@/services/bacnetService";

import SiteOverview from "@/components/dashboard/SiteOverview";
import DivisionCards from "@/components/dashboard/DivisionCards";
import MetricCard from "@/components/dashboard/MetricCard";
import { UtilityCards } from "@/components/dashboard/UtilityCards";
import { ConsumptionChart } from "@/components/dashboard/ConsumptionChart";
import ConsumptionBreakdown from "@/components/dashboard/ConsumptionBreakdown";
import { MeterTable } from "@/components/dashboard/MeterTable";
import LiveDataFreshness from "@/components/dashboard/LiveDataFreshness";
import UtilityWiseConsumption from "@/components/dashboard/UtilityWiseConsumption";

const DIVISION_LABELS = {
  dyeing: "Dyeing",
  weaving: "Weaving",
  apparel: "Apparel",
  kgl: "KGL",
};

const DIVISION_DESCRIPTIONS = {
  dyeing: "Textile Processing",
  weaving: "Yarn & Fabric Production",
  apparel: "Garment Manufacturing",
  kgl: "Knitting & Garments (KGL)",
};

const COLORS = {
  blue: "blue",
  green: "green",
  cyan: "cyan",
  purple: "purple",
};

const STALE_AFTER_MS = 30_000;

const UTILITY_DEFINITIONS = [
  {
    key: "electricity",
    label: "Electricity",
    unit: "kWh",
    icon: Zap,
    aliases: ["electricity", "electrical", "electric", "power"],
  },
  {
    key: "water",
    label: "Water",
    unit: "units",
    icon: Droplets,
    aliases: ["water", "water meter"],
  },
  {
    key: "gas",
    label: "Gas",
    unit: "units",
    icon: Flame,
    aliases: ["gas", "natural gas"],
  },
  {
    key: "steam",
    label: "Steam",
    unit: "units",
    icon: Waves,
    aliases: ["steam"],
  },
  {
    key: "air",
    label: "Compressed Air",
    unit: "units",
    icon: Wind,
    aliases: ["air", "compressed air"],
  },
];

const formatNumber = (value) => {
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

const normalizeDivisionName = (key, division) => {
  const divisionKey = String(division?.key ?? key ?? "").toLowerCase();

  return (
    division?.name ||
    division?.divisionName ||
    DIVISION_LABELS[divisionKey] ||
    divisionKey ||
    "Unknown Division"
  );
};

const normalizeDivisions = (rawDivisions) => {
  if (Array.isArray(rawDivisions)) {
    return rawDivisions.map((division, index) => {
      const key = String(
        division?.key ?? division?.divisionName ?? `division-${index + 1}`,
      ).toLowerCase();

      const divisionMeters = Array.isArray(division?.meters)
        ? division.meters
        : [];

      return {
        ...division,
        key,
        name: normalizeDivisionName(key, division),
        description:
          division?.description || DIVISION_DESCRIPTIONS[key] || "Division",
        meters: divisionMeters,
        summary: division?.summary || summarizeMeters(divisionMeters),
      };
    });
  }

  if (rawDivisions && typeof rawDivisions === "object") {
    return Object.entries(rawDivisions).map(([key, value]) => {
      const divisionMeters = Array.isArray(value)
        ? value
        : Array.isArray(value?.meters)
          ? value.meters
          : [];

      return {
        ...(Array.isArray(value) ? {} : value),
        key,
        name: normalizeDivisionName(key, value),
        description:
          value?.description || DIVISION_DESCRIPTIONS[key] || "Division",
        meters: divisionMeters,
        summary: value?.summary || summarizeMeters(divisionMeters),
      };
    });
  }

  return [];
};

const normalizeUtility = (meter) => {
  const value =
    meter?.utility ??
    meter?.utilityType ??
    meter?.utility_type ??
    meter?.utilityName ??
    meter?.utility_name ??
    meter?.energyType ??
    meter?.energy_type ??
    meter?.meterType ??
    meter?.meter_type ??
    "";

  return String(value).trim().toLowerCase();
};

const getMeterReading = (meter, field) => {
  const candidates = [
    meter?.readings?.[field]?.liveValue,
    meter?.readings?.[field]?.value,
    meter?.live?.[field],
    meter?.[field]?.liveValue,
    meter?.[field]?.value,
    meter?.[field],
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const value = Number(candidate);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
};

const UtilityTotals = ({ meters = [] }) => {
  const totals = useMemo(() => {
    const safeMeters = Array.isArray(meters) ? meters : [];

    return UTILITY_DEFINITIONS.map((utility) => {
      const mappedMeters = safeMeters.filter((meter) => {
        const meterUtility = normalizeUtility(meter);

        // Do not guess utility type from the meter name.
        // Only count meters with an explicit utility mapping.
        return utility.aliases.includes(meterUtility);
      });

      const readings = mappedMeters
        .map((meter) => getMeterReading(meter, "kwh"))
        .filter((value) => value !== null);

      const total = readings.reduce((sum, value) => sum + value, 0);

      return {
        ...utility,
        meterCount: mappedMeters.length,
        readingCount: readings.length,
        total,
      };
    });
  }, [meters]);

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Live Utility Totals
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Consumption totals from explicitly mapped utility meters.
            </p>
          </div>

          <span className="rounded-md border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-[11px] text-cyan-200">
            Live BACnet readings
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-5">
        {totals.map((utility) => {
          const Icon = utility.icon;
          const isConfigured = utility.meterCount > 0;
          const hasReadings = utility.readingCount > 0;

          return (
            <article
              key={utility.key}
              className="min-w-0 rounded-lg border border-white/10 bg-black p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-400">
                  {utility.label}
                </p>

                <Icon
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-cyan-300"
                />
              </div>

              <p className="mt-3 break-words text-xl font-semibold tabular-nums text-white">
                {!isConfigured
                  ? "Not configured"
                  : !hasReadings
                    ? "No reading"
                    : formatNumber(utility.total)}
              </p>

              <p className="mt-2 text-[11px] leading-4 text-neutral-500">
                {!isConfigured
                  ? "No meters mapped to this utility"
                  : `${utility.readingCount} of ${utility.meterCount} meters reporting`}
              </p>

              {isConfigured && hasReadings && (
                <p className="mt-1 text-[11px] text-neutral-500">
                  Unit: {utility.unit}
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div className="border-t border-white/10 px-4 py-3 sm:px-5">
        <p className="text-[11px] leading-5 text-neutral-500">
          Totals use the kWh reading field. Water, gas, steam and air require
          their own mapped meters and compatible consumption readings. Unmapped
          utilities are not assumed to be zero.
        </p>
      </div>
    </section>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);

  const [showMeters, setShowMeters] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useBacnetDashboard();

  const meters = useMemo(
    () => (Array.isArray(data?.meters) ? data.meters : []),
    [data?.meters],
  );

  console.log("meters :", meters);

  const divisions = useMemo(
    () => normalizeDivisions(data?.divisions),
    [data?.divisions],
  );

  const summary = useMemo(() => summarizeMeters(meters), [meters]);

  // The timestamp changes every second so the stale warning can
  // appear even when no new React Query response arrives.
  useMemo(() => {
    const timer = setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const receivedMs = data?.receivedAt
    ? new Date(data.receivedAt).getTime()
    : dataUpdatedAt || NaN;

  const hasTimestamp = Number.isFinite(receivedMs);
  const ageMs = hasTimestamp ? Math.max(0, clockNow - receivedMs) : Infinity;

  const isStale = !hasTimestamp || ageMs > STALE_AFTER_MS;

  const handleRefresh = () => {
    refetch();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1900px] space-y-5 p-3 sm:p-5 xl:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Kohinoor Mills
            </p>

            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Energy & Utilities Dashboard
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Live BACnet readings across all divisions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-400 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  isError || isStale
                    ? "bg-red-400"
                    : isFetching
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                }`}
              />

              {isError
                ? "Connection issue"
                : isStale
                  ? "Data may be stale"
                  : isFetching
                    ? "Updating readings"
                    : "Live data current"}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={isFetching}
              className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08] hover:text-white"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </header>

        {isPending ? (
          <section className="flex min-h-[45vh] items-center justify-center rounded-xl border border-white/10 bg-black">
            <div className="flex flex-col items-center gap-3 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
              <p className="text-sm font-medium text-white">
                Loading BACnet readings
              </p>
              <p className="text-xs text-neutral-500">
                Retrieving configured meters and division summaries
              </p>
            </div>
          </section>
        ) : isError && !data ? (
          <section className="rounded-xl border border-red-500/20 bg-black p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white">
                  Live data unavailable
                </h2>

                <p className="mt-2 break-words text-sm leading-6 text-neutral-400">
                  {error?.message ||
                    "Could not load BACnet dashboard readings."}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="mt-4 border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      isFetching ? "animate-spin" : ""
                    }`}
                  />
                  Try again
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Live data freshness and stale-data warning */}
            <LiveDataFreshness
              receivedAt={data?.receivedAt}
              isFetching={isFetching}
              isError={isError}
            />

            {/* Explicitly mapped utility totals */}
            <UtilityTotals meters={meters} />

            {/* Existing dashboard components */}
            <SiteOverview divisions={divisions} />

            <DivisionCards
              divisions={divisions}
              onSelect={(key) => {
                navigate(`/${encodeURIComponent(key)}`);
              }}
            />

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr_0.95fr]">
              <ConsumptionChart divisions={divisions} />

              <UtilityCards meters={meters} />

              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <ConsumptionBreakdown divisions={divisions} />
              </div>
            </section>

            {/* Existing combined KPIs */}
            <UtilityWiseConsumption meters={meters} />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Gauge}
                label="Configured Meters"
                value={formatNumber(summary.meterCount)}
                detail="Meters in the current dashboard response"
                accent={COLORS.blue}
              />

              <MetricCard
                icon={Wifi}
                label="Meters with Status Reading"
                value={formatNumber(summary.onlineMeters)}
                detail="Meters with a positive status value"
                accent={COLORS.green}
              />

              <MetricCard
                icon={Zap}
                label="Power Reading Total"
                value={formatNumber(summary.totalPower)}
                detail="Raw total; verify configured units"
                accent={COLORS.cyan}
              />

              <MetricCard
                icon={Activity}
                label="kWh Reading Total"
                value={formatNumber(summary.totalKwh)}
                detail="Counter sum; verify meter semantics"
                accent={COLORS.purple}
              />
            </section>

            {showMeters && (
              <MeterTable
                meters={meters}
                onClose={() => setShowMeters(false)}
              />
            )}

            <footer className="flex flex-col gap-3 border-t border-white/10 px-1 py-4 text-[11px] text-neutral-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <span>Kohinoor Mills · Energy & Utilities Management System</span>

              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isError || isStale
                      ? "bg-red-400"
                      : isFetching
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                />
                {isError
                  ? "Last refresh failed"
                  : isStale
                    ? "Readings are stale"
                    : "Automatic refresh every 10 seconds"}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {hasTimestamp
                  ? `Last successful read: ${new Date(
                      receivedMs,
                    ).toLocaleTimeString()}`
                  : "Waiting for first reading"}
              </span>
            </footer>
          </>
        )}
      </div>
    </main>
  );
};

export default DashboardPage;

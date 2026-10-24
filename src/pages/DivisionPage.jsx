import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  Clock3,
  RadioTower,
  RefreshCw,
  WifiOff,
  Activity,
  Zap,
  Gauge,
  Building2,
} from "lucide-react";

import { useBacnetDashboard } from "@/hooks/useBacnetDashboard";
import { summarizeMeters } from "@/services/bacnetService";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/Panel";

import DivisionHero from "@/components/division/DivisionHero";
import DivisionMetrics from "@/components/division/DivisionMetrics";
import DivisionCharts from "@/components/division/DivisionCharts";
import DepartmentCards from "@/components/division/DepartmentCards";
import SteamFlow from "@/components/division/SteamFlow";
import DivisionUtilityStatus from "@/components/division/DivisionUtilityStatus";

const DIVISIONS = {
  dyeing: {
    name: "Dyeing",
    description:
      "Live electrical readings, department meters and utility monitoring for Dyeing operations.",
    image: "/division/dyeing.jpg",
  },
  weaving: {
    name: "Weaving",
    description:
      "Live electrical readings, department meters and utility monitoring for Weaving operations.",
    image: "/division/weaving.jpg",
  },
  apparel: {
    name: "Apparel",
    description:
      "Live electrical readings, department meters and utility monitoring for Apparel operations.",
    image: "/division/apparel.jpg",
  },
  kgl: {
    name: "KGL",
    description:
      "Live electrical readings, department meters and utility monitoring for KGL operations.",
    image: "/division/kgl.jpg",
  },
};

const normalizeDivision = (value) => {
  try {
    return decodeURIComponent(String(value ?? ""))
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");
  } catch {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");
  }
};

const normalizeKey = (value) => normalizeDivision(value).replace(/\s+/g, "");

const isValidReading = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const getReading = (meter, field) => {
  const reading = meter?.readings?.[field];

  if (isValidReading(reading?.liveValue)) {
    return Number(reading.liveValue);
  }

  if (isValidReading(meter?.live?.[field])) {
    return Number(meter.live[field]);
  }

  // Some backend responses expose the current point value directly.
  // Use it only when the object identifies it as a live value.
  if (
    meter?.hasLiveValue === true &&
    meter?.instance !== undefined &&
    isValidReading(meter?.liveValue)
  ) {
    const pointField = String(
      meter?.pointName || meter?.field || "",
    ).toLowerCase();

    if (pointField === field) {
      return Number(meter.liveValue);
    }
  }

  return null;
};

const formatNumber = (value, digits = 2) => {
  if (!isValidReading(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(Number(value));
};

const SectionTitle = ({ eyebrow, title, description }) => (
  <div className="mb-4">
    {eyebrow && (
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
        {eyebrow}
      </p>
    )}

    <h2 className="mt-1 text-base font-semibold tracking-tight text-white sm:text-lg">
      {title}
    </h2>

    {description && (
      <p className="mt-1 text-xs leading-5 text-neutral-500 sm:text-sm">
        {description}
      </p>
    )}
  </div>
);

const StatCard = ({ title, value, unit, icon: Icon, detail }) => (
  <Panel>
    <div className="flex h-full items-start justify-between gap-3 p-4 sm:p-5 bg-[#0A0A0A]">
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-400">{title}</p>

        <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
          <span className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {value}
          </span>

          {unit && <span className="text-xs text-neutral-500">{unit}</span>}
        </div>

        {detail && (
          <p className="mt-2 text-[11px] leading-4 text-neutral-500">
            {detail}
          </p>
        )}
      </div>

      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </Panel>
);

const DivisionPage = () => {
  const params = useParams();
  const navigate = useNavigate();

  const divisionParam = params.division || params.divisionName || "dyeing";

  const divisionKey = normalizeKey(divisionParam);

  const division = DIVISIONS[divisionKey] || {
    name: String(divisionParam)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase()),
    description:
      "Live electrical readings, department meters and utility monitoring.",
    image: "",
  };

  const {
    data: dashboardData,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useBacnetDashboard();

  // Get meters from the actual backend divisions object first.
  const meters = useMemo(() => {
    if (!dashboardData) return [];

    const divisions = dashboardData.divisions || {};

    const matchingKey = Object.keys(divisions).find(
      (key) => normalizeKey(key) === divisionKey,
    );

    if (matchingKey && Array.isArray(divisions[matchingKey])) {
      return divisions[matchingKey];
    }

    // Fallback for APIs that return a flat meters array.
    if (Array.isArray(dashboardData.meters)) {
      return dashboardData.meters.filter(
        (meter) => normalizeKey(meter?.division) === divisionKey,
      );
    }

    return [];
  }, [dashboardData, divisionKey]);

  // Build summaries from nested live readings, not BACnet instance IDs.
  const liveSummary = useMemo(() => {
    const powerValues = [];
    const kwhValues = [];
    const currentValues = [];

    let metersWithReadings = 0;
    let metersWithoutReadings = 0;
    let statusActive = 0;

    meters.forEach((meter) => {
      const power = getReading(meter, "power");
      const kwh = getReading(meter, "kwh");
      const amp = getReading(meter, "amp");
      const status = getReading(meter, "status");

      const hasAnyReading = [power, kwh, amp, status].some(
        (value) => value !== null,
      );

      if (hasAnyReading) {
        metersWithReadings += 1;
      } else {
        metersWithoutReadings += 1;
      }

      if (status !== null && status > 0) {
        statusActive += 1;
      }

      if (power !== null) powerValues.push(power);
      if (kwh !== null) kwhValues.push(kwh);
      if (amp !== null) currentValues.push(amp);
    });

    const sum = (values) => values.reduce((total, value) => total + value, 0);

    return {
      meterCount: meters.length,
      metersWithReadings,
      metersWithoutReadings,
      statusActive,
      powerCount: powerValues.length,
      kwhCount: kwhValues.length,
      currentCount: currentValues.length,
      totalPower: sum(powerValues),
      totalKwh: sum(kwhValues),
      averageCurrent: currentValues.length
        ? sum(currentValues) / currentValues.length
        : null,
    };
  }, [meters]);

  const summary = useMemo(() => {
    const baseSummary = summarizeMeters(meters) || {};

    return {
      ...baseSummary,
      totalPower: liveSummary.totalPower,
      totalKwh: liveSummary.totalKwh,
      meterCount: meters.length,
      metersWithReadings: liveSummary.metersWithReadings,
      metersWithoutReadings: liveSummary.metersWithoutReadings,
      averageCurrent: liveSummary.averageCurrent,
    };
  }, [meters, liveSummary]);

  // Group meters by their actual backend department names.
  const departmentSummary = useMemo(() => {
    const groups = new Map();

    meters.forEach((meter) => {
      const name = String(meter?.department || "Unknown department").trim();

      if (!groups.has(name)) {
        groups.set(name, {
          name,
          meterCount: 0,
          onlineCount: 0,
          metersWithReadings: 0,
          power: 0,
          powerCount: 0,
          kwh: 0,
          kwhCount: 0,
          current: 0,
          currentCount: 0,
        });
      }

      const group = groups.get(name);
      group.meterCount += 1;

      const power = getReading(meter, "power");
      const kwh = getReading(meter, "kwh");
      const amp = getReading(meter, "amp");
      const status = getReading(meter, "status");

      if ([power, kwh, amp, status].some((value) => value !== null)) {
        group.metersWithReadings += 1;
      }

      if (status !== null && status > 0) {
        group.onlineCount += 1;
      }

      if (power !== null) {
        group.power += power;
        group.powerCount += 1;
      }

      if (kwh !== null) {
        group.kwh += kwh;
        group.kwhCount += 1;
      }

      if (amp !== null) {
        group.current += amp;
        group.currentCount += 1;
      }
    });

    return [...groups.values()].sort(
      (first, second) => second.power - first.power,
    );
  }, [meters]);

  const lastUpdated = useMemo(() => {
    const timestamp = dashboardData?.receivedAt || dataUpdatedAt;

    if (!timestamp) return "Waiting for first reading";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Timestamp unavailable";
    }

    return date.toLocaleString();
  }, [dashboardData?.receivedAt, dataUpdatedAt]);

  const handleBack = () => navigate("/");

  const handleOpenDepartmentReport = (departmentName) => {
    navigate(
      `/${encodeURIComponent(divisionParam)}/department/${encodeURIComponent(
        departmentName,
      )}`,
    );
  };

  if (isPending) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-52 rounded-2xl border border-white/10 bg-neutral-950" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 rounded-2xl border border-white/10 bg-neutral-950"
              />
            ))}
          </div>

          <div className="h-80 rounded-2xl border border-white/10 bg-neutral-950" />
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-neutral-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading live BACnet readings…
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <Panel className="w-full max-w-lg">
          <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-300" />

            <h1 className="mt-4 text-lg font-semibold">
              Unable to load live readings
            </h1>

            <p className="mt-2 break-words text-sm leading-6 text-neutral-400">
              {error?.message ||
                "The BACnet dashboard data could not be loaded."}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Try again
              </Button>

              <Button
                variant="outline"
                onClick={handleBack}
                className="border-white/15 bg-black text-white hover:bg-white/10"
              >
                Back to dashboard
              </Button>
            </div>
          </div>
        </Panel>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black font-sans text-white">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-5 sm:py-6 lg:px-7 xl:px-8">
        <DivisionHero
          division={division}
          meterCount={meters.length}
          isFetching={isFetching}
          onBack={handleBack}
          onRefresh={() => refetch()}
        />

        {/* Department Monitoring - shown directly below the Division Hero */}
        <section className="space-y-4">
          <SectionTitle
            eyebrow="Department overview"
            title="Department Monitoring"
            description="Select a department to open its detailed meter report."
          />

          {departmentSummary.length > 0 ? (
            <DepartmentCards
              departments={departmentSummary}
              onDepartmentClick={handleOpenDepartmentReport}
            />
          ) : (
            <Panel>
              <div className="p-8 text-center">
                <Building2 className="mx-auto h-8 w-8 text-neutral-600" />
                <p className="mt-3 text-sm text-neutral-400">
                  No departments found for this division.
                </p>
              </div>
            </Panel>
          )}
        </section>

        {/* Live summary cards */}
        <section className="space-y-3">
          <SectionTitle
            eyebrow="Live overview"
            title={`${division.name} at a glance`}
            description="Values are calculated from available nested BACnet live readings."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Configured meters"
              value={formatNumber(meters.length, 0)}
              icon={Building2}
              detail={`${liveSummary.metersWithReadings} meters have readings`}
            />

            <StatCard
              title="Total Power"
              value={formatNumber(liveSummary.totalPower)}
              unit="backend units"
              icon={Zap}
              detail={`${liveSummary.powerCount} meters with power readings`}
            />

            <StatCard
              title="Total Energy"
              value={formatNumber(liveSummary.totalKwh)}
              unit="kWh"
              icon={Activity}
              detail={`${liveSummary.kwhCount} meters with energy readings`}
            />

            <StatCard
              title="Average Current"
              value={formatNumber(liveSummary.averageCurrent)}
              unit="backend units"
              icon={Gauge}
              detail={`${liveSummary.currentCount} meters with current readings`}
            />
          </div>
        </section>

        {/* Consumption and electrical KPIs */}
        <section className="space-y-3">
          <SectionTitle
            eyebrow="Division overview"
            title="Consumption & Electrical KPIs"
            description="Aggregated from the division's actual BACnet live readings."
          />

          <DivisionMetrics summary={summary} meters={meters} />
        </section>

        {/* Utility readings, demand/alarm status and SLD navigation */}
        <DivisionUtilityStatus meters={meters} />

        {/* Steam flow */}
        <section className="space-y-3">
          <SectionTitle
            eyebrow="Steam monitoring"
            title="Steam Flow Distribution"
            description="Steam supply, main header and department distribution. Values must come from configured steam flow readings."
          />

          <SteamFlow
            data={dashboardData?.divisions}
            isLoading={isPending}
            isFetching={isFetching}
            isError={isError}
          />
        </section>

        {/* Department comparison */}
        <section className="space-y-3">
          <SectionTitle
            eyebrow="Department analytics"
            title="Department Power & Energy Comparison"
            description="Compare departments using actual nested power and kWh readings."
          />

          <DivisionCharts meters={meters} />
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-2 border-t border-white/10 py-4 text-[11px] text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>EMS · {division.name} Division</span>

          <span>
            Meters: {meters.length} · Reporting:{" "}
            {liveSummary.metersWithReadings} · Power:{" "}
            {formatNumber(liveSummary.totalPower)} · kWh:{" "}
            {formatNumber(liveSummary.totalKwh)}
          </span>
        </footer>
      </div>
    </main>
  );
};

export default DivisionPage;

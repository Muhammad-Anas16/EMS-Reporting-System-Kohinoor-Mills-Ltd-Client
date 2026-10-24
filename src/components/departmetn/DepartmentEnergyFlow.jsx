import { useMemo, useState } from "react";
import { Zap, Gauge, Activity, ChevronRight } from "lucide-react";

const DepartmentFlowDiagram = ({ meters = [] }) => {
  const [utility, setUtility] = useState("power");

  const utilities = [
    { id: "power", label: "Power", icon: Zap, unit: "kW" },
    { id: "energy", label: "Energy", icon: Gauge, unit: "kWh" },
    { id: "current", label: "Current", icon: Activity, unit: "A" },
  ];

  const getValue = (meter) => {
    const candidates = {
      power: [meter.power, meter.kw, meter.kW, meter.presentPower],
      energy: [meter.kwh, meter.kWh, meter.energy, meter.totalKwh],
      current: [meter.amp, meter.amps, meter.current],
    };

    const value = candidates[utility].find(
      (item) => item !== null && item !== undefined && item !== "",
    );

    return Number.isFinite(Number(value)) ? Number(value) : null;
  };

  const departments = useMemo(() => {
    const grouped = meters.reduce((acc, meter) => {
      const department =
        meter.departmentName || meter.department || meter.area || "Unassigned";

      if (!acc[department]) {
        acc[department] = {
          name: department,
          meters: [],
        };
      }

      acc[department].meters.push(meter);
      return acc;
    }, {});

    return Object.values(grouped).map((department) => {
      const readings = department.meters.map(getValue);
      const validReadings = readings.filter((value) => value !== null);

      return {
        ...department,
        total: validReadings.reduce((sum, value) => sum + value, 0),
        validCount: validReadings.length,
        meterCount: department.meters.length,
      };
    });
  }, [meters, utility]);

  const total = departments.reduce(
    (sum, department) => sum + department.total,
    0,
  );

  const selectedUtility = utilities.find((item) => item.id === utility);

  const formatValue = (value) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold sm:text-base">
            Department Monitoring
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Utility-wise live readings
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {utilities.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setUtility(id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                utility === id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/70">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {selectedUtility.label}
          </p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight">
            {formatValue(total)}
            <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
              {selectedUtility.unit}
            </span>
          </p>
        </div>

        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {departments.length} Departments
        </span>
      </div>

      {/* Department cards */}
      {departments.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => {
            const hasReadings = department.validCount > 0;

            return (
              <div
                key={department.name}
                className="group rounded-lg border border-slate-200 px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        hasReadings ? "bg-emerald-500" : "bg-red-500"
                      }`}
                      title={
                        hasReadings
                          ? "At least one reading is available"
                          : "No valid readings available"
                      }
                    />

                    <h3 className="truncate text-sm font-medium">
                      {department.name}
                    </h3>
                  </div>

                  <ChevronRight
                    size={15}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5"
                  />
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold tabular-nums">
                      {hasReadings ? formatValue(department.total) : "—"}
                      <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                        {selectedUtility.unit}
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {department.validCount}/{department.meterCount} meters
                      with readings
                    </p>
                  </div>

                  {!hasReadings && (
                    <span className="rounded bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      No data
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No department meter data available.
          </p>
        </div>
      )}
    </section>
  );
};

export default DepartmentFlowDiagram;

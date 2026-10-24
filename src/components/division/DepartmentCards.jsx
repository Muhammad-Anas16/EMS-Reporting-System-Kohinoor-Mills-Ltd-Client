import { Building2, CheckCircle2, FileText, Gauge, Zap } from "lucide-react";

import { Panel } from "@/components/dashboard/Panel";

const departmentImages = {
  finishing: "/departments/Finishing.jpg",
  power_dbs: "/departments/PowerDBs.jpg",
  pretreatment: "/departments/Pretreatment.jpg",
  utility: "/departments/Utility.jpg",
  dyeing: "/departments/Dyeing.jpg",
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

const DepartmentCards = ({ departments = [], onDepartmentClick }) => {
  if (!departments.length) {
    return (
      <Panel>
        <div className="flex flex-col items-center px-4 py-5 text-center">
          <Building2 className="h-8 w-8 text-neutral-600" />

          <h3 className="mt-2 text-sm font-semibold text-white">
            No departments available
          </h3>

          <p className="mt-1 max-w-md text-xs text-neutral-500">
            Department cards will appear when meters with department names are
            available in the selected division.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {departments.map((department) => {
        const hasPower = department.powerCount > 0;
        const hasKwh = department.kwhCount > 0;

        const departmentKey = String(department.name ?? "")
          .toLowerCase()
          .trim();

        const departmentImage = departmentImages[departmentKey];

        const otherMeters = Math.max(
          0,
          department.meterCount - department.onlineCount,
        );

        return (
          <div
            key={department.name}
            role="link"
            tabIndex={0}
            aria-label={`Open ${department.name} report`}
            title={`Open ${department.name} report`}
            onClick={() => onDepartmentClick?.(department.name)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onDepartmentClick?.(department.name);
              }
            }}
            className="group min-w-0 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-neutral-950 outline-none transition-colors hover:border-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {/* Compact department image */}
            <div className="relative h-20 overflow-hidden bg-neutral-900 sm:h-24">
              {departmentImage ? (
                <img
                  src={departmentImage}
                  alt={`${department.name} department`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="h-8 w-8 text-neutral-600" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

              <h3 className="absolute bottom-2 left-3 right-3 truncate text-sm font-semibold text-white">
                {department.name}
              </h3>
            </div>

            {/* Meter count */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2">
              <span className="text-xs text-neutral-400">Total meters</span>

              <span className="text-sm font-semibold tabular-nums text-white">
                {formatNumber(department.meterCount)}
              </span>
            </div>

            {/* Power and energy */}
            <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <Zap className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                  Power
                </div>

                <p className="mt-1 truncate text-sm font-semibold tabular-nums text-white">
                  {hasPower ? formatNumber(department.power) : "—"}
                  <span className="ml-1 text-[10px] font-normal text-neutral-500">
                    kW
                  </span>
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <Gauge className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  Energy
                </div>

                <p className="mt-1 truncate text-sm font-semibold tabular-nums text-white">
                  {hasKwh ? formatNumber(department.kwh) : "—"}
                  <span className="ml-1 text-[10px] font-normal text-neutral-500">
                    kWh
                  </span>
                </p>
              </div>
            </div>

            {/* Status and report indicator */}
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] px-3 py-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {department.onlineCount} positive status
                </span>
              </span>

              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-cyan-300 group-hover:text-cyan-200">
                View report
                <FileText className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Other meters */}
            <div className="border-t border-white/[0.05] px-3 py-1.5 text-[10px] text-neutral-500">
              {otherMeters} other / unconfirmed
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DepartmentCards;

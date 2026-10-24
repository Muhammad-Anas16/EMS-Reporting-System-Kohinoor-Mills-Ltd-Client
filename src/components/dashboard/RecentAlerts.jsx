
import { useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleHelp,
  Zap,
  Activity,
} from "lucide-react";

import { Panel } from "@/components/dashboard/Panel";

export function RecentAlerts({ meters = [] }) {
  const alerts = useMemo(() => {
    if (!Array.isArray(meters)) return [];

    const results = [];
    const seen = new Set();

    const addAlert = (meter, type, severity) => {
      const meterKey =
        meter?.meter_key ??
        meter?.meter_id ??
        meter?.id ??
        meter?.meter_name;

      const division =
        meter?.division ??
        meter?.divisionName ??
        meter?.division_name ??
        "Unknown division";

      const identity = `${division}-${meterKey}-${type}`;

      if (seen.has(identity)) return;
      seen.add(identity);

      results.push({
        key: identity,
        title:
          type === "power"
            ? "Power reading unavailable"
            : "Status reading unavailable",
        detail: `${meter?.meter_name || meterKey || "Unnamed meter"} · ${division}`,
        severity,
        type,
      });
    };

    meters.forEach((meter) => {
      if (!meter?.readings?.power?.hasLiveValue) {
        addAlert(meter, "power", "warning");
      }

      if (!meter?.readings?.status?.hasLiveValue) {
        addAlert(meter, "status", "info");
      }
    });

    return results;
  }, [meters]);

  const visibleAlerts = alerts.slice(0, 5);
  const powerAlerts = alerts.filter((alert) => alert.type === "power").length;
  const statusAlerts = alerts.filter((alert) => alert.type === "status").length;

  return (
    <Panel
      title="Data Quality & Alerts"
      subtitle="Missing live readings across configured meters"
      icon={Bell}
    >
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-neutral-400">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs">Power missing</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {powerAlerts}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-neutral-400">
              <Activity className="h-4 w-4 text-sky-400" />
              <span className="text-xs">Status missing</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {statusAlerts}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <p className="text-xs font-medium text-neutral-300">
            Reading checks
          </p>
          <span className="text-xs text-neutral-500">
            {alerts.length} total
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-start gap-3 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

            <div>
              <p className="text-sm font-medium text-white">
                No missing readings detected
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                All configured power and status readings report a live value.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleAlerts.map((alert) => (
              <div
                key={alert.key}
                className="flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3"
              >
                <div
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                    alert.severity === "warning"
                      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                      : "border-sky-400/20 bg-sky-400/10 text-sky-300"
                  }`}
                >
                  {alert.severity === "warning" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CircleHelp className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-neutral-200">
                    {alert.title}
                  </p>
                  <p className="mt-1 break-words text-[11px] leading-5 text-neutral-500">
                    {alert.detail}
                  </p>
                </div>
              </div>
            ))}

            {alerts.length > visibleAlerts.length && (
              <p className="pt-1 text-center text-xs text-neutral-500">
                Showing {visibleAlerts.length} of {alerts.length} alerts
              </p>
            )}
          </div>
        )}

        <p className="text-[11px] leading-5 text-neutral-600">
          These alerts are derived from missing live values. They do not
          represent confirmed BACnet device alarms.
        </p>
      </div>
    </Panel>
  );
}

export default RecentAlerts;

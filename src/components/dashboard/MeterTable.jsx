import { X } from "lucide-react";
import ReadingValue from "@/components/common/ReadingValue";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/Panel";

const fmt = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)
    : "—";

export function MeterTable({ meters = [], onClose }) {
  return (
    <Panel
      title="All Meter Readings"
      subtitle={`${meters.length} configured meter records`}
      icon={null}
      action={
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close meter table"
        >
          <X className="h-4 w-4" />
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-[#091722] text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              {[
                "Meter",
                "Division",
                "Department",
                "Power",
                "kWh",
                "Amp",
                "Status",
              ].map((label) => (
                <th key={label} className="px-4 py-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meters.map((meter, index) => (
              <tr
                key={`${meter.division}-${meter.meter_key}-${index}`}
                className="border-t border-slate-800/80 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-medium text-slate-200">
                  {meter.meter_name || meter.meter_key || "Unnamed meter"}
                </td>
                <td className="px-4 py-3 capitalize text-slate-400">
                  {meter.division || "—"}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {meter.department || "—"}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  <ReadingValue value={meter.readings?.power?.liveValue ?? meter.readings?.power?.value} reading={meter.readings?.power} />
                </td>
                <td className="px-4 py-3 text-slate-200">
                  <ReadingValue value={meter.readings?.kwh?.liveValue ?? meter.readings?.kwh?.value} reading={meter.readings?.kwh} />
                </td>
                <td className="px-4 py-3 text-slate-200">
                  <ReadingValue value={meter.readings?.amp?.liveValue ?? meter.readings?.amp?.value} reading={meter.readings?.amp} />
                </td>
                <td className="px-4 py-3 text-slate-200">
                  <ReadingValue value={meter.readings?.status?.liveValue ?? meter.readings?.status?.value} reading={meter.readings?.status} />
                </td>
              </tr>
            ))}
            {meters.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No configured meters found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

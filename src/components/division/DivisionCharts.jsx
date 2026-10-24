// import { useMemo, useState } from "react";
// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";
// import { ChartNoAxesCombined, Zap } from "lucide-react";
// import { Panel } from "@/components/dashboard/Panel";

// const formatNumber = (value) =>
//   Number.isFinite(Number(value))
//     ? new Intl.NumberFormat("en-US", {
//         maximumFractionDigits: 2,
//       }).format(Number(value))
//     : "—";

// const getReading = (meter, field) => {
//   const value = meter?.readings?.[field]?.liveValue;

//   return value !== null &&
//     value !== undefined &&
//     value !== "" &&
//     Number.isFinite(Number(value))
//     ? Number(value)
//     : null;
// };

// const DivisionCharts = ({ meters = [] }) => {
//   const [metric, setMetric] = useState("power");

//   const chartData = useMemo(() => {
//     const groups = new Map();

//     meters.forEach((meter) => {
//       const department = meter.department || "Unknown department";

//       if (!groups.has(department)) {
//         groups.set(department, {
//           department,
//           power: 0,
//           kwh: 0,
//           powerCount: 0,
//           kwhCount: 0,
//         });
//       }

//       const row = groups.get(department);
//       const power = getReading(meter, "power");
//       const kwh = getReading(meter, "kwh");

//       if (power !== null) {
//         row.power += power;
//         row.powerCount += 1;
//       }

//       if (kwh !== null) {
//         row.kwh += kwh;
//         row.kwhCount += 1;
//       }
//     });

//     return [...groups.values()]
//       .map((row) => ({
//         ...row,
//         value:
//           metric === "power"
//             ? row.powerCount
//               ? row.power
//               : null
//             : row.kwhCount
//               ? row.kwh
//               : null,
//       }))
//       .filter((row) => row.value !== null)
//       .sort((a, b) => b.value - a.value);
//   }, [meters, metric]);

//   const total = chartData.reduce((sum, row) => sum + row.value, 0);

//   return (
//     <Panel
//       title="Department Consumption Profile"
//       subtitle="Department-level aggregation of current BACnet readings, not historical usage"
//       icon={ChartNoAxesCombined}
//     >
//       <div className="p-4 sm:p-5">
//         <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
//           <div>
//             <p className="text-xs text-neutral-500">
//               Combined {metric === "power" ? "power" : "kWh"} reading
//             </p>

//             <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
//               {chartData.length ? formatNumber(total) : "—"}
//             </p>

//             <p className="mt-1 text-xs text-neutral-600">
//               {chartData.length} departments with readings
//             </p>
//           </div>

//           <div
//             className="inline-flex rounded-lg border border-white/10 p-1"
//             role="group"
//             aria-label="Select chart metric"
//           >
//             {[
//               { value: "power", label: "Power" },
//               { value: "kwh", label: "kWh" },
//             ].map((item) => (
//               <button
//                 key={item.value}
//                 type="button"
//                 onClick={() => setMetric(item.value)}
//                 className={`rounded-md px-3 py-2 text-xs transition-colors ${
//                   metric === item.value
//                     ? "bg-white text-black"
//                     : "text-neutral-400 hover:text-white"
//                 }`}
//               >
//                 {item.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {chartData.length > 0 ? (
//           <div className="h-[300px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 data={chartData}
//                 margin={{
//                   top: 8,
//                   right: 12,
//                   left: 0,
//                   bottom: 54,
//                 }}
//               >
//                 <CartesianGrid
//                   stroke="#262626"
//                   strokeDasharray="3 3"
//                   vertical={false}
//                 />

//                 <XAxis
//                   dataKey="department"
//                   tick={{ fill: "#a3a3a3", fontSize: 10 }}
//                   axisLine={{ stroke: "#404040" }}
//                   tickLine={false}
//                   angle={-28}
//                   textAnchor="end"
//                   interval={0}
//                   height={65}
//                 />

//                 <YAxis
//                   tick={{ fill: "#737373", fontSize: 11 }}
//                   axisLine={false}
//                   tickLine={false}
//                   tickFormatter={formatNumber}
//                   width={64}
//                 />

//                 <Tooltip
//                   cursor={{ fill: "#ffffff08" }}
//                   contentStyle={{
//                     background: "#090909",
//                     border: "1px solid #333",
//                     borderRadius: 10,
//                     color: "#fff",
//                   }}
//                   labelStyle={{ color: "#a3a3a3" }}
//                   formatter={(value) => [
//                     formatNumber(value),
//                     metric === "power" ? "Power reading" : "kWh reading",
//                   ]}
//                 />

//                 <Bar
//                   dataKey="value"
//                   name={metric === "power" ? "Power" : "kWh"}
//                   radius={[5, 5, 0, 0]}
//                   maxBarSize={46}
//                 >
//                   {chartData.map((row, index) => (
//                     <Cell
//                       key={row.department}
//                       fill={index === 0 ? "#22d3ee" : "#525252"}
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         ) : (
//           <div className="flex h-56 flex-col items-center justify-center text-center">
//             <Zap className="h-7 w-7 text-neutral-600" />

//             <p className="mt-3 text-sm text-neutral-400">
//               No valid readings for this chart
//             </p>

//             <p className="mt-1 text-xs text-neutral-600">
//               Chart appears when live power or kWh values are available.
//             </p>
//           </div>
//         )}
//       </div>
//     </Panel>
//   );
// };

// export default DivisionCharts;
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined, Zap } from "lucide-react";
import { Panel } from "@/components/dashboard/Panel";

const DEPARTMENT_COLORS = [
  "#22D3EE",
  "#A78BFA",
  "#34D399",
  "#FBBF24",
  "#F472B6",
  "#60A5FA",
  "#FB923C",
  "#2DD4BF",
  "#E879F9",
  "#A3E635",
  "#F87171",
  "#818CF8",
  "#4ADE80",
  "#FACC15",
  "#38BDF8",
  "#C084FC",
];

const formatNumber = (value) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(Number(value))
    : "—";

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

const getDepartmentColor = (department, departments) => {
  const index = departments.indexOf(department);
  return DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
};

const DivisionCharts = ({ meters = [] }) => {
  const [metric, setMetric] = useState("power");

  const chartData = useMemo(() => {
    const groups = new Map();
    const safeMeters = Array.isArray(meters) ? meters : [];

    safeMeters.forEach((meter) => {
      const department =
        String(meter?.department ?? "").trim() || "Unknown department";

      if (!groups.has(department)) {
        groups.set(department, {
          department,
          power: 0,
          kwh: 0,
          powerCount: 0,
          kwhCount: 0,
        });
      }

      const row = groups.get(department);
      const power = getReading(meter, "power");
      const kwh = getReading(meter, "kwh");

      if (power !== null) {
        row.power += power;
        row.powerCount += 1;
      }

      if (kwh !== null) {
        row.kwh += kwh;
        row.kwhCount += 1;
      }
    });

    const departments = [...groups.keys()].sort((a, b) => a.localeCompare(b));

    return [...groups.values()]
      .map((row) => {
        const hasReading =
          metric === "power" ? row.powerCount > 0 : row.kwhCount > 0;

        return {
          ...row,
          value: hasReading ? row[metric] : null,
          color: getDepartmentColor(row.department, departments),
        };
      })
      .filter((row) => row.value !== null)
      .sort((a, b) => b.value - a.value);
  }, [meters, metric]);

  const total = chartData.reduce((sum, row) => sum + row.value, 0);

  const metricLabel = metric === "power" ? "Power" : "kWh";
  const unitLabel = metric === "power" ? "Power reading" : "kWh reading";

  return (
    <Panel
      title="Department Consumption Profile"
      subtitle="Department-level aggregation of current BACnet readings, not historical usage"
      icon={ChartNoAxesCombined}
    >
      <div className="p-4 sm:p-5 bg-[#0A0A0A]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-neutral-500">
              Combined {metricLabel} reading
            </p>

            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {chartData.length ? formatNumber(total) : "—"}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              {chartData.length} departments with readings
            </p>
          </div>

          <div
            className="inline-flex rounded-lg border border-white/10 p-1"
            role="group"
            aria-label="Select chart metric"
          >
            {[
              { value: "power", label: "Power" },
              { value: "kwh", label: "kWh" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMetric(item.value)}
                aria-pressed={metric === item.value}
                className={`rounded-md px-3 py-2 text-xs transition-colors ${
                  metric === item.value
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 8,
                    right: 12,
                    left: 0,
                    bottom: 54,
                  }}
                >
                  <CartesianGrid
                    stroke="#262626"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="department"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    axisLine={{ stroke: "#404040" }}
                    tickLine={false}
                    angle={-28}
                    textAnchor="end"
                    interval={0}
                    height={65}
                  />

                  <YAxis
                    tick={{ fill: "#a3a3a3", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatNumber}
                    width={64}
                  />

                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    contentStyle={{
                      background: "#090909",
                      border: "1px solid #333",
                      borderRadius: 10,
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#a3a3a3" }}
                    formatter={(value) => [formatNumber(value), unitLabel]}
                  />

                  <Bar
                    dataKey="value"
                    name={metricLabel}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={46}
                    isAnimationActive={false}
                  >
                    {chartData.map((row) => (
                      <Cell key={row.department} fill={row.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {chartData.map((row) => (
                <div
                  key={row.department}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: row.color }}
                  />

                  <span className="min-w-0 flex-1 truncate text-xs text-neutral-400">
                    {row.department}
                  </span>

                  <span className="shrink-0 text-xs font-medium tabular-nums text-white">
                    {formatNumber(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center text-center">
            <Zap className="h-7 w-7 text-neutral-600" />

            <p className="mt-3 text-sm text-neutral-400">
              No valid readings for this chart
            </p>

            <p className="mt-1 text-xs text-neutral-600">
              Chart appears when live power or kWh values are available.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default DivisionCharts;

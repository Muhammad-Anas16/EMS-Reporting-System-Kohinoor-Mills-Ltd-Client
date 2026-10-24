import {
  Pie,
  PieChart,
  LabelList,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const DEFAULT_COLORS = [
  "#22D3EE",
  "#E5E7EB",
  "#A3A3A3",
  "#60A5FA",
  "#34D399",
  "#C084FC",
];

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);

const PieChartLabelList = ({
  data = [],
  dataKey = "value",
  nameKey = "name",
  colors = DEFAULT_COLORS,
  height = 260,
  valueFormatter = formatNumber,
  showLabels = true,
  showTooltip = true,
  emptyMessage = "No chart data available",
  ariaLabel = "Pie chart",
}) => {
  // console.log("data ", data);
  const chartData = data
    .map((item) => ({
      ...item,
      [dataKey]: Number(item[dataKey]),
    }))
    .filter((item) => Number.isFinite(item[dataKey]) && item[dataKey] > 0);

  const total = chartData.reduce((sum, item) => sum + item[dataKey], 0);

  if (!chartData.length || total <= 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-white/10 bg-black px-4 text-sm text-neutral-500"
        style={{ height }}
        role="status"
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full" role="img" aria-label={ariaLabel}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {showTooltip && (
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: "#090909",
                  border: "1px solid #333333",
                  borderRadius: "8px",
                  color: "#F5F5F5",
                }}
                itemStyle={{ color: "#F5F5F5" }}
                labelStyle={{ color: "#A3A3A3" }}
                formatter={(value, name) => [
                  valueFormatter(Number(value)),
                  name,
                ]}
              />
            )}

            <Pie
              data={chartData}
              dataKey={dataKey}
              nameKey={nameKey}
              stroke="#000000"
              strokeWidth={2}
              isAnimationActive={false}
              labelLine={false}
            >
              {chartData.map((item, index) => (
                <Cell
                  key={`${item[nameKey]}-${index}`}
                  fill={item.color || colors[index % colors.length]}
                />
              ))}

              {showLabels && (
                <LabelList
                  dataKey={nameKey}
                  position="outside"
                  fill="#E5E5E5"
                  stroke="none"
                  fontSize={11}
                  formatter={(value) => {
                    const label = String(value ?? "");
                    return label.length > 13 ? `${label.slice(0, 12)}…` : label;
                  }}
                />
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {chartData.map((item, index) => {
          const value = item[dataKey];
          const share = (value / total) * 100;
          const color = item.color || colors[index % colors.length];

          return (
            <div
              key={`${item[nameKey]}-${index}`}
              className="flex min-w-0 items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
              />

              <span className="min-w-0 flex-1 truncate text-xs text-neutral-400">
                {item[nameKey]}
              </span>

              <span className="shrink-0 text-xs font-medium text-white">
                {share.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieChartLabelList;

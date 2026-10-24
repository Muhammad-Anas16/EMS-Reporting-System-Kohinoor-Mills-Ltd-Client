import React from "react";

const ElectricalFlowDiagram = ({
  config,
  safeMeters = [],
  sourceMeters = [],
  departmentData = [],
  sourcePaths = [],
  departmentPaths = [],
  totalValue = 0,
  availableCount = 0,
  maxDepartmentValue = 1,
  SOURCE_POSITIONS = [],
  DEPARTMENT_POSITIONS = [],
  CENTER = { x: 475, y: 260 },
  formatNumber = (value) => value,
  shortNumber = (value) => value,
}) => {
  if (!config) return null;

  const id = React.useId().replace(/:/g, "");

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 shadow-xl shadow-black/10">
      <style>{`
        .electrical-flow .flow-wire {
          fill: none;
          stroke-width: 1.5;
          stroke-opacity: .52;
          vector-effect: non-scaling-stroke;
        }

        .electrical-flow .flow-glow {
          fill: none;
          stroke-width: 5;
          stroke-opacity: .12;
          filter: blur(3px);
          vector-effect: non-scaling-stroke;
        }

        .electrical-flow .flow-particle {
          filter: drop-shadow(0 0 4px currentColor);
        }

        .electrical-flow .flow-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: division-pulse 2.4s ease-in-out infinite;
        }

        @keyframes division-pulse {
          0%, 100% { opacity: .55; }
          50% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .electrical-flow .flow-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <header className="flex min-w-0 flex-col gap-3 border-b border-white/[0.07] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white sm:text-base">
            Electrical distribution
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400 sm:text-xs">
            Supply inputs, combined load and department branches
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: config.color,
                boxShadow: `0 0 8px ${config.color}`,
              }}
            />
            Flow animation
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
            {safeMeters.length} meters
          </span>
        </div>
      </header>

      {/* Mobile layout: readable cards without tiny SVG labels or horizontal scrolling */}
      <div className="space-y-3 p-3 sm:hidden">
        <div className="grid grid-cols-1 gap-2">
          {sourceMeters.length > 0 ? (
            sourceMeters.map((source, index) => (
              <div
                key={`${source.name}-${index}`}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M13 2 5 13h6l-1 9 9-12h-6l0-8Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">
                    {source.name}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Supply source
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="break-words text-sm font-semibold text-white">
                    {formatNumber(source.value)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {config.unit}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-3 text-xs leading-relaxed text-slate-400">
              No supply-source readings are available in the current data.
            </div>
          )}
        </div>

        <div className="flex justify-center" aria-hidden="true">
          <div className="flex flex-col items-center gap-1">
            <span className="h-3 w-px bg-gradient-to-b from-cyan-300/70 to-sky-300/30" />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-slate-500">
              Total distribution
            </span>
            <span className="h-3 w-px bg-gradient-to-b from-sky-300/30 to-violet-300/70" />
          </div>
        </div>

        <div
          className="rounded-2xl border p-4 text-center"
          style={{
            borderColor: `${config.color}35`,
            background: `linear-gradient(145deg, ${config.color}0d, rgba(15,23,42,.85))`,
            boxShadow: `inset 0 0 25px ${config.color}07`,
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[.16em] text-slate-400">
            Total load
          </p>
          <p className="mt-2 break-words text-3xl font-semibold tracking-tight text-white">
            {formatNumber(totalValue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{config.unit}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/10 px-2.5 py-1 text-[10px] text-slate-400">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: config.color }}
            />
            {availableCount} readings available
          </div>
        </div>

        <div className="flex justify-center" aria-hidden="true">
          <div className="flex flex-col items-center gap-1">
            <span className="h-3 w-px bg-gradient-to-b from-violet-300/70 to-white/10" />
            <span className="text-[10px] text-slate-500">
              Department consumers
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {departmentData.map((department) => {
            const share = Math.min(
              100,
              (Math.abs(department.total) / Math.max(1, maxDepartmentValue)) *
                100,
            );

            return (
              <article
                key={department.key}
                className="min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-1 shrink-0 rounded-full"
                    style={{
                      background: department.color,
                      boxShadow: `0 0 10px ${department.color}45`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200">
                      {department.label}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {department.availableCount}/{department.meterCount}{" "}
                      readings
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="break-words text-sm font-semibold text-white">
                      {formatNumber(department.total)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {config.unit}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${share}%`,
                      background: department.color,
                    }}
                  />
                </div>
              </article>
            );
          })}

          {departmentData.length === 0 && (
            <p className="rounded-xl border border-white/[0.08] p-4 text-center text-xs text-slate-500">
              No department data available.
            </p>
          )}
        </div>
      </div>

      {/* Desktop/tablet layout: existing animated SVG flow remains unchanged */}
      <div className="hidden min-w-0 sm:block">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 1000 520"
            role="img"
            aria-label={`${config.label}: ${formatNumber(totalValue)} ${config.unit}`}
            className="block h-auto w-full min-w-[700px]"
          >
            <defs>
              <pattern
                id={`${id}-grid`}
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M24 0H0V24"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity=".07"
                  strokeWidth=".7"
                />
              </pattern>

              <radialGradient id={`${id}-center`}>
                <stop offset="0%" stopColor={config.color} stopOpacity=".12" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <filter
                id={`${id}-glow`}
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {sourcePaths.map((path) => (
                <path
                  key={path.id}
                  id={`${id}-${path.id}`}
                  d={path.d}
                  fill="none"
                />
              ))}

              {departmentPaths.map((path) => (
                <path
                  key={path.id}
                  id={`${id}-${path.id}`}
                  d={path.d}
                  fill="none"
                />
              ))}
            </defs>

            <rect width="1000" height="520" fill={`url(#${id}-grid)`} />

            {sourcePaths.map((path, index) => {
              const source = sourceMeters[index];
              const point = SOURCE_POSITIONS[index];

              if (!source || !point) return null;

              return (
                <g key={path.id}>
                  <use
                    href={`#${id}-${path.id}`}
                    className="flow-glow"
                    stroke={config.color}
                  />
                  <use
                    href={`#${id}-${path.id}`}
                    className="flow-wire"
                    stroke={config.color}
                  />

                  <circle r="3" fill={config.color}>
                    <animateMotion
                      dur={`${2.8 + index * 0.45}s`}
                      begin={`${index * -0.8}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${id}-${path.id}`} />
                    </animateMotion>
                  </circle>

                  <circle r="2" fill="currentColor" opacity=".85">
                    <animateMotion
                      dur={`${2.8 + index * 0.45}s`}
                      begin={`${index * -0.8 - 1.2}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${id}-${path.id}`} />
                    </animateMotion>
                  </circle>

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="28"
                    fill="transparent"
                    stroke={config.color}
                    strokeOpacity=".75"
                    strokeWidth="1.5"
                  />

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="33"
                    fill="none"
                    stroke={config.color}
                    strokeOpacity=".16"
                    strokeWidth="5"
                    className="flow-pulse"
                  />

                  <text
                    x={point.x}
                    y={point.y - 3}
                    fill="currentColor"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {shortNumber(source.value)}
                  </text>

                  <text
                    x={point.x}
                    y={point.y + 10}
                    fill="currentColor"
                    opacity=".65"
                    textAnchor="middle"
                    fontSize="8"
                  >
                    {config.unit}
                  </text>

                  <text
                    x={point.x}
                    y={point.y + 47}
                    fill="currentColor"
                    opacity=".7"
                    textAnchor="middle"
                    fontSize="10"
                  >
                    {source.name.length > 15
                      ? `${source.name.slice(0, 13)}…`
                      : source.name}
                  </text>
                </g>
              );
            })}

            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="61"
              fill={config.color}
              fillOpacity=".035"
              className="flow-pulse"
            />

            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="51"
              fill="none"
              stroke={config.color}
              strokeOpacity=".15"
              strokeWidth="8"
            />

            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="43"
              fill={`url(#${id}-center)`}
              stroke={config.color}
              strokeWidth="2.2"
              filter={`url(#${id}-glow)`}
            />

            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="35"
              fill="none"
              stroke={config.color}
              strokeOpacity=".2"
            />

            <text
              x={CENTER.x}
              y={CENTER.y - 7}
              fill="currentColor"
              textAnchor="middle"
              fontSize="18"
              fontWeight="700"
            >
              {shortNumber(totalValue)}
            </text>

            <text
              x={CENTER.x}
              y={CENTER.y + 9}
              fill="currentColor"
              opacity=".7"
              textAnchor="middle"
              fontSize="9"
            >
              {config.unit}
            </text>

            <text
              x={CENTER.x}
              y={CENTER.y + 67}
              fill="currentColor"
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
            >
              Total Load
            </text>

            <text
              x={CENTER.x}
              y={CENTER.y + 82}
              fill="currentColor"
              opacity=".6"
              textAnchor="middle"
              fontSize="9"
            >
              {availableCount} readings available
            </text>

            {departmentData.map((department, index) => {
              const point = DEPARTMENT_POSITIONS[index];
              const path = departmentPaths[index];

              if (!point || !path) return null;

              const radius =
                21 +
                Math.sqrt(
                  Math.abs(department.total) / Math.max(1, maxDepartmentValue),
                ) *
                  9;

              return (
                <g key={department.key}>
                  <use
                    href={`#${id}-${path.id}`}
                    className="flow-glow"
                    stroke={department.color}
                  />
                  <use
                    href={`#${id}-${path.id}`}
                    className="flow-wire"
                    stroke={department.color}
                  />

                  <circle r="3.2" fill={department.color}>
                    <animateMotion
                      dur={`${2.6 + index * 0.35}s`}
                      begin={`${index * -0.55}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${id}-${path.id}`} />
                    </animateMotion>
                  </circle>

                  <circle r="2" fill="currentColor" opacity=".85">
                    <animateMotion
                      dur={`${2.6 + index * 0.35}s`}
                      begin={`${index * -0.55 - 1.1}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${id}-${path.id}`} />
                    </animateMotion>
                  </circle>

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={radius + 5}
                    fill={department.color}
                    fillOpacity=".04"
                    className="flow-pulse"
                  />

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={radius}
                    fill="transparent"
                    stroke={department.color}
                    strokeWidth="1.7"
                  />

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={Math.max(8, radius - 6)}
                    fill="none"
                    stroke={department.color}
                    strokeOpacity=".18"
                  />

                  <text
                    x={point.x}
                    y={point.y - 3}
                    fill="currentColor"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                  >
                    {shortNumber(department.total)}
                  </text>

                  <text
                    x={point.x}
                    y={point.y + 10}
                    fill="currentColor"
                    opacity=".7"
                    textAnchor="middle"
                    fontSize="8"
                  >
                    {config.unit}
                  </text>

                  <text
                    x={point.x}
                    y={point.y + radius + 15}
                    fill={department.color}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {department.label}
                  </text>

                  <text
                    x={point.x}
                    y={point.y + radius + 27}
                    fill="currentColor"
                    opacity=".6"
                    textAnchor="middle"
                    fontSize="8"
                  >
                    {department.availableCount}/{department.meterCount} meters
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
};

export default ElectricalFlowDiagram;

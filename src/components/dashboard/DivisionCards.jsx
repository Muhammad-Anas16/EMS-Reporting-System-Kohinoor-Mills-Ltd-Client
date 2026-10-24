import { motion, useReducedMotion } from "motion/react";
import {
  ChevronRight,
  Droplets,
  Factory,
  Gauge,
  Shirt,
  Waves,
  Zap,
} from "lucide-react";

const palettes = {
  dyeing: {
    icon: Droplets,
    image: "/division/dyeing.jpg",
    dot: "bg-rose-400",
    border: "hover:border-rose-400/50",
    iconColor: "text-rose-300",
  },
  weaving: {
    icon: Factory,
    image: "/division/weaving.jpg",
    dot: "bg-blue-400",
    border: "hover:border-blue-400/50",
    iconColor: "text-blue-300",
  },
  apparel: {
    icon: Shirt,
    image: "/division/apparel.jpg",
    dot: "bg-emerald-400",
    border: "hover:border-emerald-400/50",
    iconColor: "text-emerald-300",
  },
  kgl: {
    icon: Waves,
    image: "/division/kgl.jpg",
    dot: "bg-purple-400",
    border: "hover:border-purple-400/50",
    iconColor: "text-purple-300",
  },
};

const DEFAULT_PALETTE = {
  icon: Factory,
  image: null,
  dot: "bg-zinc-400",
  border: "hover:border-white/25",
  iconColor: "text-zinc-300",
};

const fmt = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(Number(value));
};

const getDivisionKey = (division) =>
  String(division?.key || division?.name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const getSummary = (division) => division?.summary ?? {};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const DivisionCards = ({ divisions = [], onSelect }) => {
  const shouldReduceMotion = useReducedMotion();
  const safeDivisions = Array.isArray(divisions) ? divisions : [];

  // console.log(safeDivisions);

  const gridVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  if (safeDivisions.length === 0) {
    return (
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-black px-5 py-14 text-center text-white"
      >
        <Factory className="mx-auto h-9 w-9 text-zinc-500" />

        <h3 className="mt-4 text-base font-semibold">No divisions available</h3>

        <p className="mt-2 text-sm text-zinc-500">
          Division data will appear here when available.
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      variants={gridVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      {safeDivisions.map((division, index) => {
        const key = getDivisionKey(division);
        const style = palettes[key] || DEFAULT_PALETTE;
        const Icon = style.icon;
        const summary = getSummary(division);

        const name = division?.name || division?.key || "Division";
        const description =
          division?.description || "Energy and utilities overview";

        const totalPower = fmt(summary.totalPower);
        console.log("totalPower : ", totalPower);
        const totalKwh = fmt(summary.totalKwh);
        console.log("totalKwh : ", totalKwh);

        const onlineMeters = summary.onlineMeters;
        const meterCount = summary.meterCount;

        const status =
          onlineMeters != null && meterCount != null
            ? `${fmt(onlineMeters)} / ${fmt(meterCount)}`
            : "—";

        const metrics = [
          {
            label: "Kw",
            value: totalPower,
            icon: Zap,
            color: "text-amber-300",
          },
          {
            label: "Kwh",
            value: totalKwh,
            icon: Gauge,
            color: "text-blue-300",
          },
          {
            label: "Status",
            value: status,
            icon: Factory,
            color: "text-emerald-300",
          },
        ];

        return (
          <motion.button
            key={division?.key || `${name}-${index}`}
            type="button"
            variants={cardVariants}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: -5,
                    transition: { duration: 0.22 },
                  }
            }
            whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
            onClick={() => onSelect?.(division?.key || key)}
            aria-label={`Open ${name} division`}
            className={`group relative min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black text-left text-white transition-colors duration-300 ${style.border}`}
          >
            {/* Larger division image */}
            <div className="relative h-56 overflow-hidden bg-zinc-950 sm:h-60 lg:h-64">
              {style.image ? (
                <motion.img
                  src={style.image}
                  alt={`${name} division`}
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  animate={shouldReduceMotion ? undefined : { scale: 1 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.045 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Icon className="h-14 w-14 text-zinc-700" />
                </div>
              )}

              {/* Solid overlay for image readability */}
              <div className="pointer-events-none absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/15" />

              {/* Division label */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-white/15 bg-black/90 px-3 py-2.5">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />

                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  {name}
                </span>
              </div>

              {/* Navigation indicator */}
              <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-black/90 transition-colors duration-200 group-hover:bg-white group-hover:text-black">
                <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>

              {/* Image title */}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-6 w-6 shrink-0 ${style.iconColor}`} />

                  <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {name}
                  </h3>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-200">
                  {description}
                </p>
              </div>
            </div>

            {/* Larger metric section */}
            <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black">
              {metrics.map((item) => {
                const MetricIcon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="min-w-0 px-3 py-4 sm:px-4 sm:py-5"
                  >
                    <p
                      className={`flex items-center gap-1.5 text-[11px] font-medium ${item.color}`}
                    >
                      <MetricIcon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </p>

                    <p className="mt-2 truncate text-base font-semibold text-white sm:text-lg">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.button>
        );
      })}
    </motion.section>
  );
};

export default DivisionCards;

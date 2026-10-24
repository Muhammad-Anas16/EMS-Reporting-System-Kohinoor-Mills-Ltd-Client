import { motion, useReducedMotion } from "motion/react";

const accents = {
  blue: "text-blue-300 border-blue-400/20",
  green: "text-emerald-300 border-emerald-400/20",
  cyan: "text-cyan-300 border-cyan-400/20",
  purple: "text-purple-300 border-purple-400/20",
  amber: "text-amber-300 border-amber-400/20",
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString() : "—";
  }

  return value;
};

export function MetricCard({
  icon: Icon,
  label = "Metric",
  value,
  detail,
  accent = "cyan",
}) {
  const shouldReduceMotion = useReducedMotion();
  const iconStyle = accents[accent] || accents.cyan;

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="
        group relative flex h-full min-w-0 flex-col
        justify-between overflow-hidden
        rounded-2xl border border-white/10
        bg-[#0A0A0A] p-4 sm:p-5 lg:p-6
        transition-colors duration-200
        hover:border-white/20 cursor-context-menu
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-5 text-neutral-400 sm:text-sm">
            {label}
          </p>

          <p
            className="
              mt-3 break-words text-2xl font-semibold
              leading-tight tracking-tight text-white
              sm:text-3xl lg:text-4xl
              [font-variant-numeric:tabular-nums]
            "
          >
            {formatValue(value)}
          </p>
        </div>

        {Icon && (
          <div
            className={`
              grid h-11 w-11 shrink-0 place-items-center
              rounded-xl border bg-white/[0.03]
              sm:h-12 sm:w-12
              ${iconStyle}
            `}
          >
            <Icon aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        )}
      </div>

      {detail && (
        <p className="mt-4 border-t border-white/[0.07] pt-3 text-xs leading-relaxed text-neutral-500 sm:text-sm">
          {detail}
        </p>
      )}
    </motion.section>
  );
}

export default MetricCard;

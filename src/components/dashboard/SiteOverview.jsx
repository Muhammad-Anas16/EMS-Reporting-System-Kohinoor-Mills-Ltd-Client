import { motion } from "motion/react";
import { Building2, MapPin, PanelsTopLeft } from "lucide-react";

const SiteOverview = ({ divisions = [] }) => {
  const divisionCount = Array.isArray(divisions) ? divisions.length : 0;

  const stats = [
    {
      label: "SITE",
      value: "Kohinoor Mills",
      icon: Building2,
    },
    {
      label: "DIVISIONS",
      value: String(divisionCount),
      icon: PanelsTopLeft,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black text-white"
    >
      {/* Section heading */}
      <div className="flex flex-col justify-between gap-5 p-5 sm:p-7 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-zinc-400">
            <MapPin size={17} />

            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Site Overview
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Kohinoor Mills
            <span className="text-zinc-500">.</span>
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            Energy and utilities monitoring across the mill site. View
            configured divisions and their overview at a glance.
          </p>
        </div>

        {/* Overview stats */}
        <div className="grid w-full grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:w-auto lg:min-w-[360px]">
          {stats.map(({ label, value, icon: Icon }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className="min-w-0 rounded-xl border border-white/10 bg-black p-3 sm:p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium tracking-[0.12em] text-zinc-500">
                  {label}
                </span>

                <Icon size={17} className="shrink-0 text-zinc-300" />
              </div>

              <p className="mt-3 break-words text-lg font-semibold text-white sm:text-xl">
                {value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Aerial drone image */}
      <div className="px-4 pb-4 sm:px-7 sm:pb-7">
        <div className="relative isolate min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-black sm:min-h-[300px] lg:min-h-[390px]">
          <img
            src="/DroneImage.jpg"
            alt="Aerial view of the Kohinoor Mills site"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Black overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Image label */}
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-white/15 bg-black/85 px-3 py-2 sm:left-5 sm:top-5">
            <MapPin size={15} className="text-white" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs">
              Kohinoor Mills · Site View
            </span>
          </div>

          {/* Bottom information bar */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 border-t border-white/10 bg-black/85 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div>
              <p className="text-sm font-medium text-white sm:text-base">
                Site Overview
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                Aerial reference image
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <PanelsTopLeft size={15} />
              <span>{divisionCount} divisions configured</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default SiteOverview;

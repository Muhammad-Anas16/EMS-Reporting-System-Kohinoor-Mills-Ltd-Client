import { ArrowLeft, Factory, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const DivisionHero = ({
  division,
  meterCount,
  isFetching,
  onBack,
  onRefresh,
}) => (
  <section className="relative isolate min-h-52 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 sm:min-h-60">
    {division.image && (
      <img
        src={division.image}
        alt={`${division.name} division`}
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    )}

    <div className="absolute inset-0 -z-10 bg-black/65" />

    <div className="flex min-h-52 flex-col justify-between gap-6 p-4 sm:min-h-60 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-white/15 bg-black/40 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className="border-white/15 bg-black/40 text-white hover:bg-white/10"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh readings
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-300">
          <Factory className="h-4 w-4" />
          Energy & Utilities Management
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {division.name} Division
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-neutral-300">
          {division.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-300">
          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5">
            {meterCount} configured meters
          </span>

          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5">
            Live snapshot
          </span>
        </div>
      </div>
    </div>
  </section>
);

export default DivisionHero;

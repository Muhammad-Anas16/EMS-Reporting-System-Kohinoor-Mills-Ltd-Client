import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  WifiOff,
} from "lucide-react";

const STALE_AFTER_MS = 30_000;

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return "Waiting for first successful reading";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Timestamp unavailable";
  }

  return date.toLocaleString();
};

const LiveDataFreshness = ({
  receivedAt,
  isFetching = false,
  isError = false,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const receivedMs = receivedAt ? new Date(receivedAt).getTime() : NaN;

  const hasTimestamp = Number.isFinite(receivedMs);

  const ageMs = hasTimestamp ? Math.max(0, now - receivedMs) : Infinity;

  const isStale = !hasTimestamp || ageMs > STALE_AFTER_MS;
  const hasWarning = isError || isStale;

  const ageLabel = !hasTimestamp
    ? "No successful reading yet"
    : ageMs < 60_000
      ? `${Math.floor(ageMs / 1000)} seconds ago`
      : `${Math.floor(ageMs / 60_000)} minutes ago`;

  const Icon = isError ? WifiOff : hasWarning ? AlertTriangle : CheckCircle2;

  const statusText = isError
    ? "Live data connection issue"
    : !hasTimestamp
      ? "Waiting for live data"
      : isStale
        ? "Live data may be stale"
        : "Live data is up to date";

  return (
    <section
      role={hasWarning ? "alert" : "status"}
      aria-live="polite"
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        hasWarning
          ? "border-amber-400/30 bg-amber-400/[0.06]"
          : "border-emerald-400/20 bg-emerald-400/[0.04]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          aria-hidden="true"
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            hasWarning ? "text-amber-300" : "text-emerald-300"
          }`}
        />

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">{statusText}</h2>

          <p className="mt-1 break-words text-xs leading-5 text-neutral-400">
            Last successful update: {formatTimestamp(receivedAt)}
            {" · "}
            {ageLabel}
          </p>

          {isStale && !isError && (
            <p className="mt-1 text-xs leading-5 text-amber-200">
              No successful update has arrived within the last 30 seconds. Check
              the BACnet connection and server response.
            </p>
          )}

          {isError && (
            <p className="mt-1 text-xs leading-5 text-amber-200">
              The latest refresh failed. Displayed readings may be from an
              earlier successful response.
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs text-neutral-400">
        <Clock3 className="h-4 w-4" />

        {isFetching ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Refreshing...
          </>
        ) : (
          "Auto-refresh every 10 seconds"
        )}
      </div>
    </section>
  );
};

export default LiveDataFreshness;

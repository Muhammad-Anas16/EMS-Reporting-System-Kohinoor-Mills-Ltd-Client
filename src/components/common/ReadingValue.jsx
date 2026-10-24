const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value));

/**
 * Displays a valid BACnet value normally. Missing/failed readings display a red 0
 * with a tooltip so they cannot be confused with a genuine numeric zero.
 */
export default function ReadingValue({ value, reading, className = "" }) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    reading?.hasLiveValue !== false;

  if (hasValue) {
    return <span className={className}>{formatNumber(value)}</span>;
  }

  const error =
    reading?.error ||
    reading?.errorMessage ||
    reading?.message ||
    (reading?.instance === null || reading?.instance === undefined
      ? "No BACnet object instance is configured for this reading."
      : "No valid reading was received from BACnet. Check the connection and object mapping.");

  return (
    <span
      className={`cursor-help font-semibold text-red-400 underline decoration-dotted underline-offset-4 ${className}`}
      title={`READING FAILED: ${error}`}
      aria-label={`Reading failed. Displaying 0 as an error indicator. ${error}`}
    >
      0
    </span>
  );
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBacnetDashboardData } from "@/services/bacnetService";

const REFRESH_INTERVAL = 10_000;
const STALE_TIME = 5_000;

export const bacnetQueryKeys = {
  all: ["bacnet"],
  dashboard: () => [...bacnetQueryKeys.all, "dashboard"],
};

const normalizeDivision = (division) =>
  String(division || "")
    .trim()
    .toLowerCase();

const useBacnetDashboard = (options = {}) =>
  useQuery({
    queryKey: bacnetQueryKeys.dashboard(),
    queryFn: getBacnetDashboardData,
    refetchInterval: REFRESH_INTERVAL,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });

export const useBacnetDashboardData = useBacnetDashboard;

export { useBacnetDashboard };

export const useBacnetDivision = (division, options = {}) => {
  const query = useBacnetDashboard(options);
  const divisionKey = normalizeDivision(division);

  const data = useMemo(() => {
    if (!query.data) return undefined;

    const divisions = query.data.divisions || {};
    const meters = divisions[divisionKey] || [];

    return {
      ...query.data,
      division: divisionKey,
      meters,
      dataCount: meters.length,
      divisions,
    };
  }, [query.data, divisionKey]);

  return {
    ...query,
    data,
  };
};

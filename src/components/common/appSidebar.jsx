import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Activity,
  Building2,
  ChevronRight,
  Factory,
  Gauge,
  LayoutDashboard,
  Zap,
} from "lucide-react";

import { useBacnetDashboard } from "@/hooks/useBacnetDashboard";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, "");

const getDivisionFromPath = (pathname) => {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || segments[0].toLowerCase() === "admin") {
    return null;
  }

  try {
    return decodeURIComponent(segments[0]);
  } catch {
    return segments[0];
  }
};

const formatValue = (value, digits = 1) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { data, isPending, isError } = useBacnetDashboard();

  const divisionParam = getDivisionFromPath(location.pathname);
  const divisionKey = normalizeKey(divisionParam);

  const divisionData = useMemo(() => {
    if (!divisionParam) return null;

    const divisions = data?.divisions ?? {};

    const matchedKey = Object.keys(divisions).find(
      (key) => normalizeKey(key) === divisionKey,
    );

    const divisionMeters = matchedKey
      ? divisions[matchedKey]
      : (data?.meters ?? []).filter(
          (meter) => normalizeKey(meter?.division) === divisionKey,
        );

    const meters = Array.isArray(divisionMeters) ? divisionMeters : [];

    const originalName = meters.find((meter) => meter?.division)?.division;

    const fallbackName = divisionParam.replace(/[-_]+/g, " ");

    const name = String(originalName || fallbackName).replace(
      /\b\w/g,
      (character) => character.toUpperCase(),
    );

    return {
      key: divisionKey,
      name,
      meters,
    };
  }, [data, divisionParam, divisionKey]);

  const departments = useMemo(() => {
    const meters = divisionData?.meters ?? [];
    const groups = new Map();

    meters.forEach((meter) => {
      const name = String(meter?.department ?? "").trim();

      if (!name) return;

      const key = normalizeKey(name);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          name,
          meterCount: 0,
          power: 0,
          powerCount: 0,
        });
      }

      const group = groups.get(key);
      group.meterCount += 1;

      const rawPower = meter?.readings?.power?.liveValue;

      const power =
        rawPower === null || rawPower === undefined || rawPower === ""
          ? null
          : Number(rawPower);

      if (power !== null && Number.isFinite(power)) {
        group.power += power;
        group.powerCount += 1;
      }
    });

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [divisionData]);

  if (!divisionParam || !divisionData) {
    return null;
  }

  const currentPath = location.pathname;
  const segments = currentPath.split("/").filter(Boolean);

  const divisionBase = `/${encodeURIComponent(divisionParam)}`;

  const isDivisionOverview =
    currentPath === divisionBase || currentPath === `${divisionBase}/`;

  const isDepartmentPage = segments[1] === "department";
  const activeDepartment = isDepartmentPage ? (segments[2] ?? "") : "";

  const isActiveDepartment = (department) =>
    normalizeKey(activeDepartment) === department.key;

  const itemClass = [
    "!bg-transparent",
    "!text-neutral-300",
    "hover:!bg-white/[0.06]",
    "hover:!text-white",
    "data-[active=true]:!bg-cyan-400/10",
    "data-[active=true]:!text-cyan-300",
    "data-[active=true]:font-semibold",
    "transition-colors",
  ].join(" ");

  const navigateTo = (path) => navigate(path);

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      className="border-r border-white/10 bg-black text-white"
    >
      {/* Division heading */}
      <SidebarHeader className="border-b border-white/10 bg-black p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
            <Factory className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide text-white">
              {divisionData.name}
            </p>

            <p className="mt-1 text-xs text-neutral-500">Division monitoring</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/50" />
            <span className="relative size-2 rounded-full bg-emerald-400" />
          </span>

          <span className="text-xs text-neutral-400">Live monitoring</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-black text-white">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isDivisionOverview}
                  tooltip="Division overview"
                  className={itemClass}
                  onClick={() => navigateTo(divisionBase)}
                >
                  <Building2 className="size-4" />
                  <span>Division Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPath.endsWith("/meters")}
                  tooltip="All meters"
                  className={itemClass}
                  onClick={() => navigateTo(`${divisionBase}/meters`)}
                >
                  <Gauge className="size-4" />
                  <span>All Meters</span>

                  <span className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] tabular-nums text-neutral-400">
                    {divisionData.meters.length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPath.endsWith("/consumption")}
                  tooltip="Energy consumption"
                  className={itemClass}
                  onClick={() => navigateTo(`${divisionBase}/consumption`)}
                >
                  <Activity className="size-4" />
                  <span>Energy Consumption</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/10" />

        {/* Departments */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            <span>Departments</span>

            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] tabular-nums text-neutral-400">
              {departments.length}
            </span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {isPending && (
              <p className="px-2 py-3 text-xs text-neutral-500">
                Loading department data...
              </p>
            )}

            {isError && (
              <p className="rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs text-red-300">
                Department data load nahi ho saka.
              </p>
            )}

            {!isPending && !isError && departments.length === 0 && (
              <p className="px-2 py-3 text-xs leading-5 text-neutral-500">
                Is division ke liye departments available nahi hain.
              </p>
            )}

            <SidebarMenu>
              {departments.map((department) => (
                <SidebarMenuItem key={department.key}>
                  <SidebarMenuButton
                    isActive={isActiveDepartment(department)}
                    tooltip={department.name}
                    className={`${itemClass} h-auto min-h-11 py-2`}
                    onClick={() =>
                      navigateTo(
                        `${divisionBase}/department/${encodeURIComponent(
                          department.name,
                        )}`,
                      )
                    }
                  >
                    <Zap className="size-4 shrink-0 text-cyan-400" />

                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">
                        {department.name}
                      </span>

                      <span className="mt-1 block truncate text-[10px] text-neutral-500 cursor-pointer">
                        {department.meterCount} meters
                        {department.powerCount > 0
                          ? ` · ${formatValue(department.power)} kW`
                          : ""}
                      </span>
                    </div>

                    <ChevronRight className="ml-auto size-3.5 shrink-0 text-neutral-600" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/10" />

        {/* Reports */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Reports
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    currentPath.endsWith("/report") && !isDepartmentPage
                  }
                  tooltip="Division report"
                  className={itemClass}
                  onClick={() => navigateTo(`${divisionBase}/report`)}
                >
                  <Activity className="size-4" />
                  <span>Division Report</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-white/10 bg-black p-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-cyan-400" />

            <p className="text-[11px] font-medium text-neutral-300">
              Kohinoor EMS
            </p>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
            Live data refreshes through the existing BACnet query.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;

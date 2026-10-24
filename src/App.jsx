import "./App.css";

import { Navigate, Route, Routes, useLocation } from "react-router";

import AuthGate from "@/components/auth/AuthGate";
import Navbar from "@/components/common/navbar";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import AppSidebar from "@/components/common/appSidebar";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import AdminPage from "@/pages/AdminPage";
import DashboardPage from "@/pages/DashboardPage";
import DivisionPage from "@/pages/DivisionPage";
import DepartmentReportPage from "@/pages/DepartmentReportPage";
import MeterReportPage from "@/pages/MeterReportPage";
import ConsumptionPage from "@/pages/ConsumptionPage";

const getDivisionFromPath = (pathname) => {
  const segments = pathname.split("/").filter(Boolean);

  if (
    !segments.length ||
    segments[0].toLowerCase() === "admin" ||
    segments[0].toLowerCase() === "departments"
  ) {
    return null;
  }

  try {
    return decodeURIComponent(segments[0]);
  } catch {
    return segments[0];
  }
};

const AppLayout = () => {
  const location = useLocation();

  const division = getDivisionFromPath(location.pathname);
  const showSidebar = Boolean(division);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        {showSidebar && <AppSidebar />}

        <SidebarInset className="min-w-0 flex-1">
          <Navbar />

          <main className="min-w-0 flex-1">
            <Routes>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/admin" element={<AdminPage />} />

              {/* Existing division overview */}
              <Route path="/:division" element={<DivisionPage />} />

              {/* Preferred Meter Report route */}
              <Route
                path="/:division/meter-report"
                element={<MeterReportPage />}
              />

              {/* Preserve the existing legacy route */}
              <Route path="/:division/meters" element={<MeterReportPage />} />

              {/* Existing division report */}
              <Route
                path="/:division/report"
                element={<DepartmentReportPage />}
              />

              {/* Existing department report */}
              <Route
                path="/:division/department/:department"
                element={<DepartmentReportPage />}
              />

              {/* Requested department URL format */}
              <Route
                path="/departments/:department"
                element={<DepartmentReportPage />}
              />

              {/* Existing consumption page */}
              <Route
                path="/:division/consumption"
                element={<ConsumptionPage />}
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthGate>
      <AppLayout />
    </AuthGate>
  </ThemeProvider>
);

export default App;

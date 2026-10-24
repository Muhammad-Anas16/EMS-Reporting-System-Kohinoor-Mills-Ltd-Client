import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Activity, CalendarDays, Clock3, LogOut, Menu, Moon, Sun, Wifi } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { logout, selectAuth } from "@/redux/features/auth/authSlice";
import { useSidebar } from "@/components/ui/sidebar";
import { useThemeMode } from "@/components/common/ThemeProvider";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toggleSidebar, open } = useSidebar();
  const { user, isAuthenticated, status } = useSelector(selectAuth);
  const { theme, toggleTheme } = useThemeMode();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = new Intl.DateTimeFormat("en-PK", { weekday: "short", month: "short", day: "2-digit", year: "numeric" }).format(currentTime);
  const time = new Intl.DateTimeFormat("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true }).format(currentTime);
  const segments = location.pathname.split("/").filter(Boolean);
  const isAdminPage = location.pathname.startsWith("/admin");
  const showSidebar = segments.length > 0 && !isAdminPage;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try { await dispatch(logout()); navigate("/", { replace: true }); }
    finally { setIsLoggingOut(false); }
  };

  return (
    <header className="ems-topbar sticky top-0 z-50 w-full">
      <div className="ems-topbar-inner">
        <div className="ems-brand-wrap">
          {showSidebar && <button className="ems-icon-button sidebar-trigger" onClick={toggleSidebar} aria-label={open ? "Close navigation" : "Open navigation"} title="Toggle navigation"><Menu size={19} /></button>}
          <button className="ems-brand" onClick={() => navigate("/")} aria-label="Go to EMS dashboard">
            <span className="ems-brand-mark"><img src="/kohinoor%20logo.png" alt="Kohinoor Mills" /></span>
            <span className="ems-brand-copy"><strong>KOHINOOR MILLS</strong><small>ENERGY MANAGEMENT SYSTEM</small></span>
          </button>
        </div>
        <div className="ems-topbar-actions">
          <div className="ems-datetime"><CalendarDays size={15} /><span>{date}</span><i /><Clock3 size={15} /><span className="ems-clock">{time}</span></div>
          <div className="ems-live-status"><span className="ems-status-dot" /><span><b>Monitoring</b><small>Live system</small></span></div>
          {!isAdminPage && <button className="ems-admin-shortcut" onClick={() => navigate("/admin")}><Activity size={15} /> Admin</button>}
          <button className="ems-icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
          {isAuthenticated && <div className="ems-user-actions"><div className="ems-user-avatar">{String(user?.username || user?.name || "U").slice(0, 1).toUpperCase()}</div><div className="ems-user-copy"><b>{user?.username || user?.name || "User"}</b><small>{user?.type || user?.role || "Authenticated"}</small></div><button className="ems-icon-button logout-button" onClick={handleLogout} disabled={isLoggingOut || status === "loading"} aria-label="Log out" title="Log out"><LogOut size={17} /></button></div>}
        </div>
      </div>
      <div className="ems-mobile-status"><Wifi size={13} /><span>EMS LIVE MONITORING</span><span className="ems-status-dot" /><span>Connected interface</span></div>
    </header>
  );
};

export default Navbar;

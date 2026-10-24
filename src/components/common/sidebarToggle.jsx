import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLocation } from "react-router";
import { useSidebar } from "@/components/ui/sidebar";

const SidebarToggle = () => {
  const location = useLocation();
  const { toggleSidebar, open, isMobile, openMobile } = useSidebar();

  const segments = location.pathname.split("/").filter(Boolean);
  const isAdminPage = segments[0] === "admin";

  // Dashboard aur admin par toggle render nahi hoga.
  if (segments.length === 0 || isAdminPage) {
    return null;
  }

  const sidebarIsOpen = isMobile ? openMobile : open;

  const handleToggle = () => {
    toggleSidebar();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={
        sidebarIsOpen ? "Close division sidebar" : "Open division sidebar"
      }
      aria-expanded={sidebarIsOpen}
      title={sidebarIsOpen ? "Close sidebar" : "Open sidebar"}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 sm:size-10"
    >
      {sidebarIsOpen ? (
        <PanelLeftClose size={20} />
      ) : (
        <PanelLeftOpen size={20} />
      )}
    </button>
  );
};

export default SidebarToggle;

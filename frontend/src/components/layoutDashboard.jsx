// src/layouts/layoutDashboard.jsx
import { useState, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Header from "../components/hearderDashboard";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const { title, subtitle } = useMemo(() => {
    if (location.pathname.startsWith("/admin/candidatures")) return { title: "Candidatures", subtitle: "" };
    if (location.pathname.startsWith("/admin/offres")) return { title: "Offres d’emploi", subtitle: "" };
    if (location.pathname.startsWith("/admin/tests")) return { title: "Tests", subtitle: "" };
    return { title: "Dashboard", subtitle: "Bienvenue cher Admin" };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64">
        <Sidebar
          isOpen={true} // toujours visible sur desktop
          setIsOpen={setSidebarOpen}
        />
      </aside>

      {/* Sidebar mobile */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />

      {/* Contenu principal */}
      <div className="flex-1 md:pl-64">
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

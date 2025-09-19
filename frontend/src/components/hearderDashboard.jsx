import { useState, useEffect } from "react";
import { FiBell, FiLogOut, FiMenu } from "react-icons/fi";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

export default function Header({ title, subtitle, onMenuClick, isDashboard = false }) {
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Récupérer le nombre de notifications non lues
  useEffect(() => {
    if (!token) return;

    const fetchUnreadCount = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://agrivision-holding.onrender.com/api/notifications/unread-count`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Erreur récupération notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNotificationClick = () => {
    navigate("/admin/notifications");
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b">
      <div className="h-16 px-2 sm:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded hover:bg-gray-100"
            aria-label="Ouvrir le menu"
          >
            <FiMenu className="text-lg sm:text-xl" style={{ color: "#094363" }} />
          </button>
          <div className="truncate min-w-0">
            {!isDashboard && (
              <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">
                {title}
              </h1>
            )}
            {isDashboard && (
              <p className="text-sm sm:text-base md:text-xl font-semibold text-gray-700 truncate">
                Bienvenue cher Admin
              </p>
            )}
            {!isDashboard && subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-2 flex-shrink-0">
          {/* Bouton de notifications avec badge */}
          <button 
            onClick={handleNotificationClick}
            className="p-2 sm:p-2 rounded hover:bg-gray-100 relative"
            aria-label="Notifications"
            disabled={loading}
          >
            <FiBell className="text-base sm:text-lg" style={{ color: "#026530" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Bouton de déconnexion */}
          <button
            onClick={handleLogout}
            className="p-1 sm:p-2 rounded bg-gray-900 text-white hover:opacity-90"
            aria-label="Se déconnecter"
          >
            <FiLogOut className="text-base sm:text-lg" />
          </button>
        </div>
      </div>
    </header>
  );
}
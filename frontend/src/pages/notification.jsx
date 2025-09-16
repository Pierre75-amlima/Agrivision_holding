import { useState, useEffect } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  MoreHorizontal,
  User,
  FileText,
  Calendar,
  AlertTriangle,
  Info
} from "lucide-react";

export default function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Types de notifications avec leurs métadonnées
  const notificationTypes = {
    NOUVELLE_CANDIDATURE: { icon: User, color: "text-blue-600", bg: "bg-blue-50" },
    TEST_TERMINE: { icon: FileText, color: "text-green-600", bg: "bg-green-50" },
    CANDIDATURE_ACCEPTEE: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    CANDIDATURE_REJETEE: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    NOUVEAU_TEST_ASSIGNE: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    ENTRETIEN_PROGRAMME: { icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
    DOCUMENT_REQUIS: { icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
    RAPPEL_TEST: { icon: Bell, color: "text-yellow-600", bg: "bg-yellow-50" },
    MISE_A_JOUR_PROFIL: { icon: User, color: "text-gray-600", bg: "bg-gray-50" }
  };

  const priorityColors = {
    BASSE: "border-l-gray-300",
    NORMALE: "border-l-blue-300",
    HAUTE: "border-l-orange-400",
    URGENTE: "border-l-red-500"
  };

  // Charger les notifications
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [currentPage, selectedFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(selectedFilter !== "ALL" && { statut: selectedFilter })
      });

      const response = await fetch(`http://localhost:5000/api/notifications?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications/stats", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  // Marquer comme lue
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === id ? { ...notif, statut: "LUE" } : notif
          )
        );
      }
    } catch (error) {
      console.error("Erreur marquer comme lue:", error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, statut: "LUE" }))
        );
      }
    } catch (error) {
      console.error("Erreur marquer toutes comme lues:", error);
    }
  };

  // Archiver une notification
  const archiveNotification = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${id}/archive`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== id));
      }
    } catch (error) {
      console.error("Erreur archivage:", error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== id));
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    if (notification.statut === "NON_LUE") {
      markAsRead(notification._id);
    }

    if (notification.lienAction) {
      navigate(notification.lienAction);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Aujourd'hui";
    if (diffDays === 2) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR");
  };

  const getNotificationIcon = (type) => {
    const IconComponent = notificationTypes[type]?.icon || Bell;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#094363] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-[#094363]" />
              <div>
                <h1 className="text-2xl font-bold text-[#094363]">Notifications</h1>
                <p className="text-gray-600">Gérez vos notifications et alertes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-[#094363] text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Tout marquer comme lu</span>
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            {["ALL", "NON_LUE", "LUE", "ARCHIVEE"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedFilter === filter
                    ? "bg-[#094363] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter === "ALL" ? "Toutes" : 
                 filter === "NON_LUE" ? "Non lues" :
                 filter === "LUE" ? "Lues" : "Archivées"}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune notification</p>
              <p className="text-gray-400">Vos notifications apparaîtront ici</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const typeConfig = notificationTypes[notification.type] || {};
                
                return (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                      priorityColors[notification.priorite]
                    } ${notification.statut === "NON_LUE" ? "bg-blue-50/30" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icône */}
                      <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                        <IconComponent className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold ${
                            notification.statut === "NON_LUE" ? "text-gray-900" : "text-gray-700"
                          }`}>
                            {notification.titre}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            {notification.statut === "NON_LUE" && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-2 ${
                          notification.statut === "NON_LUE" ? "text-gray-700" : "text-gray-600"
                        }`}>
                          {notification.message}
                        </p>

                        {/* Badges de priorité */}
                        {notification.priorite !== "NORMALE" && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            notification.priorite === "HAUTE" ? "bg-orange-100 text-orange-800" :
                            notification.priorite === "URGENTE" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {notification.priorite === "HAUTE" ? "Priorité haute" :
                             notification.priorite === "URGENTE" ? "Urgent" :
                             notification.priorite}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        {notification.statut === "NON_LUE" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Marquer comme lue"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveNotification(notification._id);
                          }}
                          className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                          title="Archiver"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import CandidatureCard from "../components/canditatCard";
import { AlertTriangle } from "lucide-react";

export default function CandidaturesOffre() {
  const { id } = useParams(); // /admin/offres/:id/candidatures
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour les popups de suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [candidatToDelete, setCandidatToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const fetchCandidatures = async () => {
      try {
        setLoading(true);
        const start = Date.now();

        const token = localStorage.getItem("token");

        const res = await fetch(`https://agrivision-holding.onrender.com/api/candidats/offre/${id}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        setCandidatures(data);

        // Minimum 500ms pour voir le skeleton
        const elapsed = Date.now() - start;
        if (elapsed < 500) await new Promise((r) => setTimeout(r, 500 - elapsed));
      } catch (error) {
        console.error("Erreur lors du chargement des candidatures :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidatures();
  }, [id]);

  // Fonction de suppression
  const handleSingleDelete = async (candidatId) => {
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch(`https://agrivision-holding.onrender.com/api/candidats/${candidatId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Erreur lors de la suppression');

      // Retirer le candidat de la liste
      setCandidatures(prev => prev.filter(c => c._id !== candidatId));
      setShowDeleteConfirm(false);
      setCandidatToDelete(null);
      
      // Afficher le popup de succès
      setShowSuccessPopup(true);
      
      // Masquer le popup de succès après 3 secondes
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);

    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression du candidat');
    } finally {
      setDeleting(false);
    }
  };

  // Gestionnaire pour la suppression individuelle
  const handleDeleteClick = (candidatId, candidatName) => {
    setCandidatToDelete({ id: candidatId, name: candidatName });
    setShowDeleteConfirm(true);
  };

  // Skeleton card
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl p-4 shadow animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div className="h-6 bg-gray-300 rounded w-1/4 mt-4"></div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Popup de succès */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Suppression réussie</h3>
                <p className="text-sm text-gray-600">Le candidat a été supprimé avec succès</p>
              </div>
            </div>
            
            <div className="w-full bg-green-200 h-1 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full animate-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Popup de confirmation suppression */}
      {showDeleteConfirm && candidatToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600">Cette action ne peut pas être annulée</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer la candidature de{' '}
              <span className="font-semibold text-[#094363]">{candidatToDelete.name}</span> ?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCandidatToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={() => handleSingleDelete(candidatToDelete.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Candidatures pour l'offre</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
          : candidatures.length === 0
          ? <p className="text-gray-500 text-center py-8 col-span-full">Aucune candidature pour cette offre.</p>
          : candidatures.map((candidat) => (
              <CandidatureCard 
                key={candidat._id} 
                candidat={candidat}
                onDelete={handleDeleteClick}
                isSelectable={false}
                isSelected={false}
                onToggleSelect={null}
              />
            ))}
      </div>

      {/* Animation CSS pour le popup de succès */}
      <style>
        {`
          @keyframes progress-bar {
            0% { width: 100%; }
            100% { width: 0%; }
          }
          .animate-progress-bar {
            animation: progress-bar 3s linear forwards;
          }
          @keyframes slide-in-from-top {
            0% {
              transform: translateY(-50px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-in.slide-in-from-top {
            animation: slide-in-from-top 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}
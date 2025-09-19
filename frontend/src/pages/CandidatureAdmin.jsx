import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import CandidatureCard from "../components/canditatCard";
import { Trash2, AlertTriangle } from "lucide-react";

export default function Candidatures() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [allCandidats, setAllCandidats] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour les popups
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [candidatToDelete, setCandidatToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [filters, setFilters] = useState({
    searchName: "",
    poste: "",
    statut: "",
    competences: [],
    testValide: "",
    minExperienceMonths: "",
  });

  const [draft, setDraft] = useState({
    ...filters,
    competencesInput: "",
  });

  // Statistiques rapides - seulement le total
  const stats = useMemo(() => {
    const total = allCandidats.length;
    return { total };
  }, [allCandidats]);

  // Fonction de recherche côté serveur
  const fetchCandidatsWithFilters = useCallback(async (searchFilters) => {
    try {
      setLoading(true);
      
      // Construire les paramètres de recherche
      const params = new URLSearchParams();
      
      if (searchFilters.searchName?.trim()) {
        params.append('search', searchFilters.searchName.trim());
      }
      if (searchFilters.poste?.trim()) {
        params.append('poste', searchFilters.poste.trim());
      }
      if (searchFilters.statut) {
        params.append('statut', searchFilters.statut);
      }
      if (searchFilters.competences?.length > 0) {
        params.append('competences', searchFilters.competences.join(','));
      }
      if (searchFilters.testValide) {
        params.append('testValide', searchFilters.testValide);
      }
      if (searchFilters.minExperienceMonths) {
        params.append('minExperienceMonths', searchFilters.minExperienceMonths);
      }

      const url = `https://agrivision-holding.onrender.com/api/candidats${params.toString() ? '?' + params.toString() : ''}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Erreur lors du chargement des candidats");

      const data = await res.json();
      setAllCandidats(data);
    } catch (err) {
      console.error("Erreur fetch candidats:", err);
      // En cas d'erreur, essayer de charger tous les candidats
      await fetchAllCandidats();
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fonction pour charger tous les candidats (fallback)
  const fetchAllCandidats = useCallback(async () => {
    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/candidats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Erreur lors du chargement des candidats");

      const data = await res.json();
      setAllCandidats(data);
    } catch (err) {
      console.error("Erreur fetch candidats:", err);
    }
  }, [token]);

  // Fonction de suppression d'un seul candidat
  const handleSingleDelete = async (candidatId) => {
    try {
      setDeleting(true);
      const res = await fetch(`https://agrivision-holding.onrender.com/api/candidats/${candidatId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Erreur lors de la suppression');

      // Retirer le candidat de la liste
      setAllCandidats(prev => prev.filter(c => c._id !== candidatId));
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

  const setDraftField = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const hasActiveFilters = useMemo(() => {
    return filters.searchName || filters.poste || filters.statut || 
           filters.competences.length > 0 || filters.testValide || 
           filters.minExperienceMonths;
  }, [filters]);

  // Fonction pour appliquer les filtres
  const onApply = async (e) => {
    e?.preventDefault?.();

    const comps = (draft.competencesInput || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const newFilters = {
      searchName: draft.searchName || "",
      poste: draft.poste || "",
      statut: draft.statut || "",
      competences: comps,
      testValide: draft.testValide || "",
      minExperienceMonths: draft.minExperienceMonths || "",
    };

    setFilters(newFilters);
    setFiltersOpen(false);
    await fetchCandidatsWithFilters(newFilters);
  };

  // Fonction de recherche manuelle (uniquement via bouton ou entrée)
  const handleManualSearch = () => {
    const newFilters = {
      ...filters,
      searchName: draft.searchName || "",
      poste: draft.poste || "",
    };
    setFilters(newFilters);
    fetchCandidatsWithFilters(newFilters);
  };

  const onReset = async () => {
    const empty = {
      searchName: "",
      poste: "",
      statut: "",
      competences: [],
      testValide: "",
      minExperienceMonths: "",
    };
    setDraft({ ...empty, competencesInput: "" });
    setFilters(empty);
    await fetchAllCandidats();
  };

  const onQuickFilter = async (type, value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    setDraft({ ...draft, [type]: value });
    await fetchCandidatsWithFilters(newFilters);
  };

  // Chargement initial
  useEffect(() => {
    fetchCandidatsWithFilters(filters);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-[#094363] mx-auto mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg">Chargement des candidatures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

      {/* Popup de confirmation suppression individuelle */}
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

      {/* Header */}
      <div className="bg-gradient-to-r from-[#094363] via-[#0a5a7a] to-[#094363] shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                  Candidatures
                </h1>
                <p className="text-blue-100 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                  Gérez et consultez toutes les candidatures reçues
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 text-sm sm:text-base flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="hidden sm:inline">
                  {filtersOpen ? 'Fermer filtres' : 'Filtres'}
                </span>
                {hasActiveFilters && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full"></div>
                )}
              </button>
            </div>
          </div>

          {/* Barre de recherche rapide - SANS recherche automatique */}
          <div className="mt-4 sm:mt-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par nom/prénom..."
                  value={draft.searchName}
                  onChange={(e) => setDraftField("searchName", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSearch();
                    }
                  }}
                  className="w-full px-4 py-2.5 pl-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                />
                <svg className="absolute left-3 top-3 h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par poste..."
                  value={draft.poste}
                  onChange={(e) => setDraftField("poste", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSearch();
                    }
                  }}
                  className="w-full px-4 py-2.5 pl-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                />
                <svg className="absolute left-3 top-3 h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6l-2 2-2-2V6" />
                </svg>
              </div>
            </div>
            
            {/* Bouton de recherche manuel */}
            <div className="flex justify-center">
              <button
                onClick={handleManualSearch}
                className="px-6 py-2.5 bg-white text-[#094363] rounded-xl font-medium hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Rechercher</span>
              </button>
            </div>
          </div>

          {/* Statistique unique - Total */}
          <div className="flex justify-center mt-4 sm:mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center min-w-[120px]">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-blue-100 text-sm sm:text-base">Candidatures</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Filtres avancés */}
        {filtersOpen && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Filtres avancés</h3>
              {hasActiveFilters && (
                <button
                  onClick={onReset}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Effacer tout
                </button>
              )}
            </div>

            <form onSubmit={onApply} className="space-y-4 sm:space-y-6">
              {/* Grille responsive pour les champs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom ou prénom
                  </label>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={draft.searchName}
                    onChange={(e) => setDraftField("searchName", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poste visé
                    <span className="text-xs text-green-600 ml-1">(recherche flexible)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Community management, Commercial..."
                    value={draft.poste}
                    onChange={(e) => setDraftField("poste", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Trouve automatiquement les variations (management → manager)
                  </p>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={draft.statut}
                    onChange={(e) => setDraftField("statut", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Accepté">Accepté</option>
                    <option value="Rejeté">Rejeté</option>
                    <option value="En attente">En attente</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compétences
                    <span className="text-xs text-green-600 ml-1">(recherche flexible)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Communication, vente..."
                    value={draft.competencesInput}
                    onChange={(e) => setDraftField("competencesInput", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test validé
                  </label>
                  <select
                    value={draft.testValide}
                    onChange={(e) => setDraftField("testValide", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="">Peu importe</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expérience min.
                  </label>
                  <input
                    type="number"
                    placeholder="En mois"
                    min="0"
                    value={draft.minExperienceMonths}
                    onChange={(e) => setDraftField("minExperienceMonths", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={onReset}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
                >
                  Réinitialiser
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#094363] to-blue-600 text-white font-medium hover:from-blue-600 hover:to-[#094363] transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Appliquer les filtres
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barre de résultats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <div className="text-base sm:text-lg font-semibold text-gray-800">
                {allCandidats.length} candidature{allCandidats.length !== 1 ? 's' : ''}
              </div>
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {filters.searchName && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <span className="truncate max-w-20 sm:max-w-none">Nom: {filters.searchName}</span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, searchName: '' }));
                          setDraft(prev => ({ ...prev, searchName: '' }));
                          fetchCandidatsWithFilters({ ...filters, searchName: '' });
                        }}
                        className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.poste && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="truncate max-w-20 sm:max-w-none">Poste: {filters.poste}</span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, poste: '' }));
                          setDraft(prev => ({ ...prev, poste: '' }));
                          fetchCandidatsWithFilters({ ...filters, poste: '' });
                        }}
                        className="ml-1 sm:ml-2 text-green-600 hover:text-green-800 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.statut && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <span className="truncate max-w-20 sm:max-w-none">Statut: {filters.statut}</span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, statut: '' }));
                          setDraft(prev => ({ ...prev, statut: '' }));
                          fetchCandidatsWithFilters({ ...filters, statut: '' });
                        }}
                        className="ml-1 sm:ml-2 text-purple-600 hover:text-purple-800 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.competences.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <span className="truncate max-w-20 sm:max-w-none">
                        Compétences: {filters.competences.join(', ')}
                      </span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, competences: [] }));
                          setDraft(prev => ({ ...prev, competences: [], competencesInput: '' }));
                          fetchCandidatsWithFilters({ ...filters, competences: [] });
                        }}
                        className="ml-1 sm:ml-2 text-yellow-600 hover:text-yellow-800 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.testValide && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      <span className="truncate max-w-20 sm:max-w-none">Test: {filters.testValide}</span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, testValide: '' }));
                          setDraft(prev => ({ ...prev, testValide: '' }));
                          fetchCandidatsWithFilters({ ...filters, testValide: '' });
                        }}
                        className="ml-1 sm:ml-2 text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.minExperienceMonths && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <span className="truncate max-w-20 sm:max-w-none">
                        Exp: {filters.minExperienceMonths}+ mois
                      </span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, minExperienceMonths: '' }));
                          setDraft(prev => ({ ...prev, minExperienceMonths: '' }));
                          fetchCandidatsWithFilters({ ...filters, minExperienceMonths: '' });
                        }}
                        className="ml-1 sm:ml-2 text-orange-600 hover:text-orange-800 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onQuickFilter('statut', filters.statut === 'En attente' ? '' : 'En attente')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.statut === 'En attente'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => onQuickFilter('statut', filters.statut === 'Accepté' ? '' : 'Accepté')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.statut === 'Accepté'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                Acceptés
              </button>
              <button
                onClick={() => onQuickFilter('statut', filters.statut === 'Rejeté' ? '' : 'Rejeté')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.statut === 'Rejeté'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                Rejetés
              </button>
            </div>
          </div>
        </div>

        {/* Liste des candidatures */}
        {allCandidats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              Aucune candidature trouvée
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6">
              {hasActiveFilters 
                ? 'Aucune candidature ne correspond à vos critères de recherche.'
                : 'Il n\'y a pas encore de candidatures dans votre base de données.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#094363] text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {allCandidats.map((candidat) => (
              <div key={candidat._id} className="relative">
                <CandidatureCard
                  candidat={candidat}
                  onDelete={() => handleDeleteClick(candidat._id, candidat.nom + ' ' + candidat.prenom)}
                  // Désactiver la clicabilité de la carte
                  onClick={() => {}} // Fonction vide pour désactiver le clic
                  isClickable={false} // Props pour indiquer que la carte n'est pas cliquable
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS personnalisé pour l'animation de la barre de progression */}
      <style jsx>{`
        @keyframes progress-bar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .animate-progress-bar {
          animation: progress-bar 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import CandidatureCard from "../components/canditatCard";

export default function Candidatures() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [allCandidats, setAllCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NOUVEAU : État de pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

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

  // Statistiques simplifiées
  const stats = useMemo(() => {
    return { 
      total: pagination.totalItems,
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages
    };
  }, [pagination]);

  // Fonction de recherche côté serveur avec debounce ET pagination
  const fetchCandidatsWithFilters = useCallback(async (searchFilters, page = 1) => {
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
      
      // AJOUTER LES PARAMÈTRES DE PAGINATION
      params.append('page', page.toString());
      params.append('limit', '20'); // 20 candidats par page

      const url = `https://agrivision-holding.onrender.com/api/candidats?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Erreur lors du chargement des candidats");

      const data = await res.json();
      
      // MISE À JOUR avec la nouvelle structure de réponse
      if (data.candidates && data.pagination) {
        setAllCandidats(data.candidates);
        setPagination(data.pagination);
      } else {
        // Fallback pour l'ancienne structure
        setAllCandidats(data);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: data.length,
          itemsPerPage: data.length,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    } catch (err) {
      console.error("Erreur fetch candidats:", err);
      // En cas d'erreur, essayer de charger tous les candidats (ancien endpoint)
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
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: data.length,
        itemsPerPage: data.length,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (err) {
      console.error("Erreur fetch candidats:", err);
    }
  }, [token]);

  // Debounce pour la recherche en temps réel
  const [searchTimeout, setSearchTimeout] = useState(null);

  const setDraftField = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const hasActiveFilters = useMemo(() => {
    return filters.searchName || filters.poste || filters.statut || 
           filters.competences.length > 0 || filters.testValide || 
           filters.minExperienceMonths;
  }, [filters]);

  // NOUVELLE FONCTION : Navigation entre les pages
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCandidatsWithFilters(filters, newPage);
      // Scroller vers le haut lors du changement de page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    // IMPORTANT : Repartir à la page 1 lors d'une nouvelle recherche
    await fetchCandidatsWithFilters(newFilters, 1);
  };

  // Recherche en temps réel pour les champs principaux
  const onQuickSearch = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setDraft({ ...draft, [field]: value });

    // Debounce pour éviter trop de requêtes
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const timeout = setTimeout(() => {
      // IMPORTANT : Repartir à la page 1 lors d'une nouvelle recherche
      fetchCandidatsWithFilters(newFilters, 1);
    }, 500);
    
    setSearchTimeout(timeout);
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
    await fetchCandidatsWithFilters(empty, 1);
  };

  // Chargement initial
  useEffect(() => {
    fetchCandidatsWithFilters(filters, 1);
  }, [token]);

  // Nettoyage du timeout
  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  // NOUVEAU : Composant de pagination
  const PaginationComponent = () => {
    if (pagination.totalPages <= 1) return null;

    const renderPageNumbers = () => {
      const pages = [];
      const current = pagination.currentPage;
      const total = pagination.totalPages;
      
      // Afficher max 5 numéros de page
      let start = Math.max(1, current - 2);
      let end = Math.min(total, start + 4);
      
      // Ajuster si on est proche de la fin
      if (end - start < 4) {
        start = Math.max(1, end - 4);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            disabled={loading}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${current === i 
                ? 'bg-[#094363] text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {i}
          </button>
        );
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} sur {pagination.totalPages}
          </span>
          <span className="text-xs text-gray-500">
            ({pagination.totalItems} candidature{pagination.totalItems !== 1 ? 's' : ''} au total)
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Bouton Précédent */}
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage || loading}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1
              ${pagination.hasPrevPage && !loading
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Précédent</span>
          </button>

          {/* Numéros de page */}
          <div className="hidden sm:flex items-center space-x-1">
            {renderPageNumbers()}
          </div>

          {/* Bouton Suivant */}
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || loading}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1
              ${pagination.hasNextPage && !loading
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <span>Suivant</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  if (loading && pagination.currentPage === 1) {
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
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Candidatures</h1>
                <p className="text-blue-100 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                  Gérez et consultez toutes les candidatures reçues
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="px-4 py-2 rounded bg-green-600 text-white hover:opacity-90 transition"
              >
                {filtersOpen ? 'Fermer filtres' : 'Voir les filtres'}
                {hasActiveFilters && (
                  <div className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full ml-2"></div>
                )}
              </button>
            </div>
          </div>

          {/* Barre de recherche rapide */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder=" Rechercher par nom/prénom..."
                value={filters.searchName}
                onChange={(e) => onQuickSearch('searchName', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 pl-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200 disabled:opacity-50"
              />
              <svg className="absolute left-3 top-3 h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder=" Rechercher par poste (ex: Community management)..."
                value={filters.poste}
                onChange={(e) => onQuickSearch('poste', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 pl-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200 disabled:opacity-50"
              />
              <svg className="absolute left-3 top-3 h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6l-2 2-2-2V6" />
              </svg>
            </div>
          </div>

          {/* Statistiques avec pagination */}
          <div className="mt-4 sm:mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4 text-center max-w-md">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-blue-100 text-xs sm:text-sm">
                Total candidatures
                {stats.totalPages > 1 && (
                  <span className="block mt-1">
                    Page {stats.currentPage} / {stats.totalPages}
                  </span>
                )}
              </div>
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
                  disabled={loading}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
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
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={onReset}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
                >
                  Réinitialiser
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#094363] to-blue-600 text-white font-medium hover:from-blue-600 hover:to-[#094363] transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base disabled:opacity-50"
                >
                  {loading ? 'Recherche...' : 'Appliquer les filtres'}
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
                {pagination.totalPages > 1 && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (page {pagination.currentPage} sur {pagination.totalPages})
                  </span>
                )}
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
                          fetchCandidatsWithFilters({ ...filters, searchName: '' }, 1);
                        }}
                        disabled={loading}
                        className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0 disabled:opacity-50"
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
                          fetchCandidatsWithFilters({ ...filters, poste: '' }, 1);
                        }}
                        disabled={loading}
                        className="ml-1 sm:ml-2 text-green-600 hover:text-green-800 flex-shrink-0 disabled:opacity-50"
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
                          fetchCandidatsWithFilters({ ...filters, statut: '' }, 1);
                        }}
                        disabled={loading}
                        className="ml-1 sm:ml-2 text-purple-600 hover:text-purple-800 flex-shrink-0 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.competences.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <span className="truncate max-w-20 sm:max-w-none">Compétences: {filters.competences.length}</span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, competences: [] }));
                          setDraft(prev => ({ ...prev, competences: [], competencesInput: '' }));
                          fetchCandidatsWithFilters({ ...filters, competences: [] }, 1);
                        }}
                        disabled={loading}
                        className="ml-1 sm:ml-2 text-yellow-600 hover:text-yellow-800 flex-shrink-0 disabled:opacity-50"
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
                          fetchCandidatsWithFilters({ ...filters, testValide: '' }, 1);
                        }}
                        disabled={loading}
                        className="ml-1 sm:ml-2 text-indigo-600 hover:text-indigo-800 flex-shrink-0 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.minExperienceMonths && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <span className="truncate max-w-20 sm:max-w-none">Exp: {filters.minExperienceMonths}+ mois</span>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, minExperienceMonths: '' }));
                          setDraft(prev => ({ ...prev, minExperienceMonths: '' }));
                          fetchCandidatsWithFilters({ ...filters, minExperienceMonths: '' }, 1);
                        }}
                        disabled={loading}
                        className="ml-1 sm:ml-2 text-orange-600 hover:text-orange-800 flex-shrink-0 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {allCandidats.length === 0 && hasActiveFilters && (
              <button
                onClick={onReset}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#094363] hover:bg-blue-50 rounded-lg transition-colors duration-200 self-start sm:self-auto disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Effacer les filtres</span>
              </button>
            )}
          </div>
          
          {/* Indicateur de recherche flexible */}
          {hasActiveFilters && (filters.poste || filters.competences.length > 0) && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Recherche flexible activée</span>
                </div>
                <div className="text-gray-300">•</div>
                <span>Résultats triés par pertinence</span>
              </div>
              <div className="text-green-600 font-medium">
                Mode intelligent
              </div>
            </div>
          )}
        </div>

        {/* Loading pour changement de page */}
        {loading && pagination.currentPage > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#094363]"></div>
              <span>Chargement de la page {pagination.currentPage}...</span>
            </div>
          </div>
        )}

        {/* Résultats */}
        {allCandidats.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              {hasActiveFilters ? 'Aucun candidat trouvé' : 'Aucune candidature'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
              {hasActiveFilters 
                ? 'Aucun résultat ne correspond à vos critères, même avec la recherche flexible.' 
                : 'Il n\'y a pas encore de candidatures enregistrées.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={onReset}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#094363] text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base mb-3 disabled:opacity-50"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Voir toutes les candidatures</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Message d'aide pour la recherche flexible */}
            {(filters.poste || filters.competences.length > 0) && !loading && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-800 font-medium mb-1">Recherche flexible activée</p>
                    <p className="text-green-700">
                      Les résultats incluent des variations automatiques de vos termes de recherche. 
                      Par exemple, "management" trouve aussi "manager", "manageur", etc.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Grille des candidats */}
            {!loading && allCandidats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6">
                {allCandidats.map((candidat, index) => (
                  <div key={candidat._id} className="relative">
                    <CandidatureCard 
                      candidat={candidat}
                    />
                    {/* Badge de pertinence pour les premiers résultats */}
                    {hasActiveFilters && index < 3 && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10">
                        {index + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Composant de pagination */}
            <PaginationComponent />
          </>
        )}
      </div>
    </div>
  );
}
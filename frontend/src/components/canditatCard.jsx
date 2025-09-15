import { useNavigate } from "react-router-dom";
import { Trash2, Check } from "lucide-react";

export default function CandidatureCard({ 
  candidat, 
  onDelete, 
  isSelectable = false, 
  isSelected = false, 
  onToggleSelect 
}) {
  const navigate = useNavigate();

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Empêcher la navigation
    if (onDelete) {
      onDelete(candidat._id, `${candidat.user?.prenoms} ${candidat.user?.nom}`);
    }
  };

  const handleSelectClick = (e) => {
    e.stopPropagation(); // Empêcher la navigation
    if (onToggleSelect) {
      onToggleSelect(candidat._id);
    }
  };

  const handleCardClick = () => {
    if (!isSelectable) {
      navigate(`/candidatures/${candidat._id}`);
    }
  };

  return (
    <div 
      className={`bg-white border rounded-2xl shadow-md p-5 flex flex-col justify-between transition-all duration-200 relative ${
        isSelectable 
          ? `cursor-pointer hover:shadow-lg ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-[#094363]/20 hover:border-blue-300'}`
          : 'border-[#094363]/20 hover:shadow-lg'
      }`}
      onClick={handleCardClick}
    >
      {/* Case à cocher pour sélection multiple */}
      {isSelectable && (
        <div 
          className={`absolute top-3 left-3 w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'border-gray-300 hover:border-blue-400 bg-white'
          }`}
          onClick={handleSelectClick}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      )}

      {/* Icône de suppression */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-all duration-200 flex items-center justify-center group"
        title="Supprimer ce candidat"
      >
        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>

      {/* Contenu principal avec marge pour les boutons */}
      <div className={`${isSelectable ? 'mt-8' : 'mt-6'}`}>
        {/* Nom */}
        <h2 className="text-xl font-bold text-[#094363] mb-2 pr-8">
          {candidat.user?.prenoms} {candidat.user?.nom}
        </h2>

        {/* Poste visé */}
        <p className="text-sm text-gray-700 mb-1">
          <span className="font-semibold">Poste visé :</span>{" "}
          {candidat.offre?.titre || "Non défini"}
        </p>

        {/* Expériences */}
        <p className="text-sm text-gray-700 mb-1">
          <span className="font-semibold">Expérience :</span>{" "}
          {candidat.experiences?.length
            ? candidat.experiences.map((e) => `${e.duree} mois`).join(", ")
            : "Non renseignée"}
        </p>

        {/* Compétences */}
        {candidat.competences?.length > 0 && (
          <div className="flex flex-wrap gap-2 my-2">
            {candidat.competences.map((comp, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#094363]/10 text-[#094363] px-2 py-1 rounded-full"
              >
                {comp}
              </span>
            ))}
          </div>
        )}

        {/* Statut */}
        <span
          className={`inline-block w-fit px-3 py-1 text-xs font-medium rounded-full mb-3 ${
            candidat.statut === "Accepté"
              ? "bg-green-100 text-green-700"
              : candidat.statut === "Rejeté"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {candidat.statut || "En attente"}
        </span>

        {/* Bouton - masqué en mode sélection */}
        {!isSelectable && (
          <button
            onClick={() => navigate(`/candidatures/${candidat._id}`)}
            className="w-full px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:opacity-90 transition"
          >
            Voir profil
          </button>
        )}
      </div>
    </div>
  );
}
import React from 'react';

export default function OffreCard({ offre, onPostulerClick, hasApplied }) {
  // Si dateLimite existe → format FR, sinon "Non définie"
  const dateLimite = offre.dateLimite
    ? new Date(offre.dateLimite).toLocaleDateString('fr-FR')
    : 'Non définie';

  return (
    <div
      className="relative bg-white p-5 rounded-lg shadow-sm transition-all duration-300
                 border border-gray-300 hover:border-[#094363] group"
    >
      {/* Ribbon Statut */}
      <div className="absolute top-0 right-0">
        <div className="bg-[#026530] text-white text-xs font-semibold px-3 py-1 rounded-bl-md shadow-md">
          {offre.statut}
        </div>
      </div>

      {/* Contenu de l’offre */}
      <div className="relative z-10">
        <h3 className="text-[#094363] font-semibold text-lg mb-2">{offre.titre}</h3>
        <p className="text-black-800 text-sm line-clamp-3">{offre.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-black-700">
            Date limite : <span className="font-medium">{dateLimite}</span>
          </span>
        </div>

        {!hasApplied && (
          <button
            onClick={() => onPostulerClick(offre._id)}
            className="mt-5 w-full bg-gradient-to-r from-[#094363] to-blue-800 text-white
                       py-2 rounded shadow-md hover:from-blue-900 hover:to-[#094363]
                       transition-all duration-300 font-semibold"
          >
            Postuler
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OffreCard from '../components/offreCard';
import { useAuth } from '../contexts/authContext';
import { useModal } from '../contexts/modalContext'; // <-- import modal context

const OffreList = () => {
  const [offres, setOffres] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openSignupModal } = useModal(); // <-- hook modal

  useEffect(() => {
    fetch('https://agrivision-holding.onrender.com/api/offres')
      .then(res => res.json())
      .then(data => {
        const sorted = data
          .sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication))
          .slice(0, 6);
        setOffres(sorted);
      })
      .catch(err => console.error("Erreur API:", err));
  }, []);

  const handlePostuler = (offreId) => {
    if (isAuthenticated) {
      navigate(`/candidature/${offreId}`);
    } else {
      localStorage.setItem('pendingOffreId', offreId);
      openSignupModal(); // <-- ouvre modal signup
    }
  };

  return (
    <section className="py-12 px-6 bg-gray-50" id="offres">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-6 bg-[#094363] rounded-sm" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#094363]">
              Offres disponibles
            </h2>
          </div>

          <button
            onClick={() => navigate('/offres')}
            className="bg-gradient-to-r from-[#026530] to-green-700 text-white
                       py-2 px-6 rounded shadow-md font-semibold transition-all duration-300
                       hover:from-green-700 hover:to-[#026530]">
            Voir toutes les offres
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offres.map(offre => (
            <OffreCard
              key={offre._id}
              offre={offre}
              onPostulerClick={handlePostuler}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OffreList;

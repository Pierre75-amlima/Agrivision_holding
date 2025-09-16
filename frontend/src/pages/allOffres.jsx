import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OffreCard from '../components/offreCard';
import { useAuth } from '../contexts/authContext';
import { useModal } from '../contexts/modalContext';

const AllOffres = () => {
  const [offres, setOffres] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openSignupModal } = useModal();

  useEffect(() => {
    fetch('https://agrivision-holding.onrender.com/api/offres')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication));
        setOffres(sorted);
      })
      .catch(err => console.error("Erreur API:", err));
  }, []);

  const handlePostuler = (offreId) => {
    if (isAuthenticated) {
      navigate(`/candidature/${offreId}`);
    } else {
      localStorage.setItem('pendingOffreId', offreId);
      openSignupModal();
    }
  };

  return (
    <section className="py-12 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#094363] mb-6">Toutes les offres</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offres.length === 0 ? (
            <div>Aucune offre disponible pour le moment.</div>
          ) : (
            offres.map(offre => (
              <OffreCard key={offre._id} offre={offre} onPostulerClick={handlePostuler} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default AllOffres;

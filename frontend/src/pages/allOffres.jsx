import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OffreCard from '../components/offreCard';
import { useAuth } from '../contexts/authContext';
import { useModal } from '../contexts/modalContext';

const AllOffres = () => {
  const [offres, setOffres] = useState([]);
  const [appliedOffers, setAppliedOffers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { openSignupModal } = useModal();

  useEffect(() => {
    setLoading(true);
    fetch('https://agrivision-holding.onrender.com/api/offres')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication));
        setOffres(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur API:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUserCandidatures();
    }
  }, [isAuthenticated, token]);

  const fetchUserCandidatures = async () => {
    try {
      const response = await fetch('https://agrivision-holding.onrender.com/api/candidates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const candidatures = await response.json();
        console.log('Candidatures:', candidatures);
        const appliedOfferIds = new Set(candidatures.map(c => c.offre._id));
        console.log('Applied offer IDs:', appliedOfferIds);
        setAppliedOffers(appliedOfferIds);
      }
    } catch (error) {
      console.error('Erreur récupération candidatures:', error);
    }
  };

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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#094363]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offres.length === 0 ? (
              <div>Aucune offre disponible pour le moment.</div>
            ) : (
              offres.map(offre => (
                <OffreCard key={offre._id} offre={offre} onPostulerClick={handlePostuler} hasApplied={appliedOffers.has(offre._id)} />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AllOffres;

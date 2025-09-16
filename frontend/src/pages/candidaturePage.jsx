import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext';
import Popup from '../components/popupp';

export default function CandidaturePage() {
  const { offreId } = useParams();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const phonePrefix = "+(229) ";
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenoms: user?.prenoms || '',
    email: user?.email || '',
    telephone: phonePrefix,
    adresse: '',
    competences: '',
    experiences: [{ societe: '', poste: '', duree: '', description: '' }],
    cv: null,
  });

  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offreTitre, setOffreTitre] = useState('');

  useEffect(() => {
    const fetchOffre = async () => {
      try {
        const res = await fetch(`https://agrivision-holding.onrender.com//api/offres/${offreId}`);
        const data = await res.json();
        setOffreTitre(data.titre || 'Offre');
      } catch (err) {
        console.error("Erreur lors de la récupération du titre de l'offre :", err);
        setOffreTitre('Offre introuvable');
      }
    };
    fetchOffre();
  }, [offreId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'telephone') {
      if (!value.startsWith(phonePrefix)) {
        setFormData(prev => ({ ...prev, telephone: phonePrefix }));
        return;
      }
      let numbers = value.slice(phonePrefix.length).replace(/\D/g, '');
      if (numbers.length > 10) numbers = numbers.slice(0, 10);
      setFormData(prev => ({ ...prev, telephone: phonePrefix + numbers }));
    } else {
      setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
    }
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperiences = [...formData.experiences];
    newExperiences[index][field] = value;
    setFormData({ ...formData, experiences: newExperiences });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experiences: [...formData.experiences, { societe: '', poste: '', duree: '', description: '' }],
    });
  };

  const removeExperience = (index) => {
    const newExperiences = [...formData.experiences];
    newExperiences.splice(index, 1);
    setFormData({ ...formData, experiences: newExperiences });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const dataToSend = new FormData();
    dataToSend.append('telephone', formData.telephone);
    dataToSend.append('adresse', formData.adresse);
    dataToSend.append('offre', offreId);
    const competencesArray = formData.competences
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
    dataToSend.append('competences', JSON.stringify(competencesArray));
    dataToSend.append('experiences', JSON.stringify(formData.experiences));
    if (formData.cv) dataToSend.append('cv', formData.cv);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://agrivision-holding.onrender.com/api/candidats`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: dataToSend,
      });

      let body;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) body = await res.json();
      else body = await res.text();

      if (!res.ok) throw new Error(body?.message || body || `Erreur serveur (${res.status})`);

      setStatusMessage({ type: 'success', text: 'Candidature envoyée avec succès !' });

      setFormData({
        nom: user?.nom || '',
        prenoms: user?.prenoms || '',
        email: user?.email || '',
        telephone: phonePrefix,
        adresse: '',
        competences: '',
        experiences: [{ societe: '', poste: '', duree: '', description: '' }],
        cv: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';

      const testRes = await fetch(
        `https://agrivision-holding.onrender.com/api/tests/by-offre/${offreId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!testRes.ok) {
        if (testRes.status === 404) {
          setStatusMessage({
            type: 'info',
            text: "Votre candidature a été enregistrée. Aucun test n'est requis pour ce poste."
          });
          setTimeout(() => {
            navigate(`/infoPosteEntretien/${body._id}`);
          }, 3000);
        } else {
          setStatusMessage({ type: 'error', text: "Impossible de vérifier le test associé." });
        }
      } else {
        const testData = await testRes.json();
        if (testData && testData._id) {
          navigate(`/testResults/${testData.offreId._id}`);
        } else {
          setStatusMessage({
            type: 'info',
            text: "Votre candidature a été enregistrée. Aucun test n'est requis pour ce poste."
          });
          setTimeout(() => {
            navigate(`/infoPosteEntretien/${body._id}`);
          }, 3000);
        }
      }

    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Erreur serveur, veuillez réessayer plus tard.' });
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => setStatusMessage(null);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header avec bouton retour */}
      <div className="relative bg-gradient-to-r from-[#094363] via-[#0a5a7a] to-[#094363] min-h-[200px] sm:min-h-[240px] lg:min-h-[280px] flex flex-col items-center justify-center text-center px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 rounded-full p-2 sm:p-3 group"
        >
          <svg 
            className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-white transform group-hover:-translate-x-1 transition-all duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Titre principal */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
            Candidature pour
          </h1>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 sm:px-6 sm:py-4 mb-4">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#c0e2ff]">
              {offreTitre}
            </span>
          </div>
          <p className="text-base sm:text-lg text-gray-100 max-w-2xl mx-auto">
            Bienvenue <span className="font-semibold text-[#c0e2ff]">{user?.prenoms}</span>, 
            merci de compléter les informations ci-dessous.
          </p>
        </div>
      </div>

      {/* Formulaire principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10">
            
            {/* Section Informations personnelles */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="mt-12 w-8 h-8 bg-gradient-to-r from-[#094363] to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h2 className="mt-12 text-xl sm:text-2xl font-bold text-gray-800">Informations personnelles</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {['nom', 'prenoms', 'email'].map((field) => (
                  <div key={field} className={field === 'email' ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 capitalize" htmlFor={field}>
                      {field === 'prenoms' ? 'Prénoms' : field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      name={field}
                      id={field}CD 
                      value={formData[field]}
                      readOnly
                      className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600 font-medium"
                    />
                  </div>
                ))}
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="telephone">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300"
                    placeholder="+(229) xxxxxxxxxx"
                    maxLength={17}
                    required
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="adresse">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    id="adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300"
                    placeholder="Votre adresse complète"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section Compétences */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-r from-[#094363] to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Compétences spécifiques</h2>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="competences">
                  Vos compétences clés *
                </label>
                <textarea
                  id="competences"
                  name="competences"
                  rows="4"
                  value={formData.competences}
                  onChange={handleChange}
                  className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300 resize-none"
                  placeholder="Ex: Gestion et animation des communautés en ligne, Gestion de projet, Communication..."
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Séparez vos compétences par des virgules</p>
              </div>
            </div>

            {/* Section Expériences */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-r from-[#094363] to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Expériences professionnelles</h2>
              </div>
              
              <div className="space-y-4">
                {formData.experiences.map((exp, idx) => (
                  <div key={idx} className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-700">Expérience {idx + 1}</h3>
                      {formData.experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-all duration-300"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nom de l'entreprise"
                        value={exp.societe}
                        onChange={(e) => handleExperienceChange(idx, 'societe', e.target.value)}
                        className="p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300"
                      />
                      <input
                        type="text"
                        placeholder="Intitulé du poste"
                        value={exp.poste}
                        onChange={(e) => handleExperienceChange(idx, 'poste', e.target.value)}
                        className="p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300"
                      />
                      <select
                        value={exp.duree}
                        onChange={(e) => handleExperienceChange(idx, 'duree', e.target.value)}
                        className="p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300"
                      >
                        <option value="">Durée de l'expérience</option>
                        {[...Array(12).keys()].map(m => (
                          <option key={m + 1} value={m + 1}>{m + 1} mois</option>
                        ))}
                        <option value="13">Plus de 12 mois</option>
                      </select>
                      <textarea
                        
                        placeholder="Description rapide"
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                        className="p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300"
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addExperience}
                  className="w-full sm:w-auto mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  + Ajouter une expérience
                </button>
              </div>
            </div>

            {/* Section CV */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-r from-[#094363] to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  4
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Votre CV</h2>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700" htmlFor="cv">
                  Télécharger votre CV (PDF uniquement) *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="cv"
                    name="cv"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleChange}
                    className="w-full p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer focus:outline-none focus:border-[#094363] focus:ring-4 focus:ring-[#094363]/10 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#094363] file:text-white hover:file:bg-[#126aa8]"
                    required
                  />
                </div>
                {formData.cv && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Fichier sélectionné : <strong>{formData.cv.name}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 sm:py-5 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-[#094363] via-[#126aa8] to-[#094363] hover:from-[#126aa8] hover:via-[#094363] hover:to-[#126aa8] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  'Soumettre ma candidature'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Popup pour message */}
      {statusMessage && (
        <Popup
          message={statusMessage.text}
          type={statusMessage.type}
          onClose={closePopup}
        />
      )}
    </div>
  );
}
import React, { useState, useRef, useContext, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { AuthContext } from "../contexts/authContext";

export default function InfoPostEntretien() {
  const { user, token, logout } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenoms: user?.prenoms || "",
    email: user?.email || "",
    telephone: "",
    adresse: "",
    photoFile: null,
    photoPreview: "",
    signature: "",
    consentement: false,
    contactsUrgence: [],
    references: [],
  });

  const [isPhoneFromDB, setIsPhoneFromDB] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const sigPadRef = useRef();

  // 🔹 Fonction pour valider et formater les numéros de téléphone (8 chiffres max)
  const handlePhoneInput = (value) => {
    let numericValue = value.replace(/\D/g, "");
    if (numericValue.length > 8) {
      numericValue = numericValue.slice(0, 8);
    }
    return numericValue;
  };

  // 🔹 Récupération automatique des données de candidature
 useEffect(() => {
  const fetchUserCandidatureData = async () => {
    if (!user || !token) return;

    try {
      setDataLoading(true);
      console.log('Récupération des données pour user:', user._id || user.id);
      
      const res = await fetch(
        `https://agrivision-holding.onrender.com/api/candidats/user/${user._id || user.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const candidatures = await res.json();
        console.log('Candidatures récupérées:', candidatures);
        
        if (candidatures && candidatures.length > 0) {
          // Trier par date de soumission pour prendre la plus récente
          const candidaturesSorted = candidatures.sort((a, b) => 
            new Date(b.dateSoumission || b.createdAt) - new Date(a.dateSoumission || a.createdAt)
          );
          
          const derniereCandidature = candidaturesSorted[0];
          console.log('Dernière candidature:', derniereCandidature);
          
          if (derniereCandidature.telephone || derniereCandidature.adresse) {
            setFormData((prev) => ({
              ...prev,
              telephone: derniereCandidature.telephone?.replace(/^\+229\s?/, '') || "",
              adresse: derniereCandidature.adresse || "",
            }));
            setIsPhoneFromDB(true);
            console.log('Données mises à jour:', {
              telephone: derniereCandidature.telephone,
              adresse: derniereCandidature.adresse
            });
          }
        } else {
          console.log('Aucune candidature trouvée');
        }
      } else {
        console.error('Erreur API:', res.status, res.statusText);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
    } finally {
      setDataLoading(false);
    }
  };

  fetchUserCandidatureData();
}, [user, token]);

  // 🔹 Champs simples
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTelephoneChange = (e) => {
    setIsPhoneFromDB(false); // ✅ Dès qu'on tape, ce n'est plus "from DB"
    const formattedValue = handlePhoneInput(e.target.value);
    setFormData((prev) => ({ ...prev, telephone: formattedValue }));
  };

  // 🔹 Contacts d'urgence
  const addContactUrgence = () =>
    setFormData((prev) => ({
      ...prev,
      contactsUrgence: [
        ...prev.contactsUrgence,
        { nom: "", prenom: "", relation: "", telephone: "" },
      ],
    }));

  const removeContactUrgence = (index) =>
    setFormData((prev) => ({
      ...prev,
      contactsUrgence: prev.contactsUrgence.filter((_, i) => i !== index),
    }));

  const handleContactUrgenceChange = (index, field, value) => {
    const updated = [...formData.contactsUrgence];
    if (field === "telephone") {
      updated[index][field] = handlePhoneInput(value);
    } else {
      updated[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, contactsUrgence: updated }));
  };

  // 🔹 Références
  const addReference = () =>
    setFormData((prev) => ({
      ...prev,
      references: [...prev.references, { nom: "", poste: "", contact: "" }],
    }));

  const removeReference = (index) =>
    setFormData((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));

  const handleReferenceChange = (index, field, value) => {
    const updated = [...formData.references];
    if (field === "contact") {
      updated[index][field] = handlePhoneInput(value);
    } else {
      updated[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, references: updated }));
  };

  // 🔹 Consentement
  const handleConsent = () =>
    setFormData((prev) => ({ ...prev, consentement: !prev.consentement }));

  // 🔹 Photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({
      ...prev,
      photoFile: file,
      photoPreview: URL.createObjectURL(file),
    }));
  };

  // 🔹 Signature
  const clearSignature = () => {
    sigPadRef.current.clear();
    setFormData((prev) => ({ ...prev, signature: "" }));
  };

  const saveSignature = () => {
    if (sigPadRef.current.isEmpty()) return null;
    const dataURL = sigPadRef.current.toDataURL();
    setFormData((prev) => ({ ...prev, signature: dataURL }));
    return dataURL;
  };

  // 🔹 Popup de succès
  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    logout();
  };

  // 🔹 Validation des numéros (8 chiffres exactement pour les saisies manuelles)
  const validatePhoneNumbers = () => {
    // Le téléphone principal : si pas de la DB et saisi, doit avoir 8 chiffres exactement
    if (!isPhoneFromDB && formData.telephone && formData.telephone.length !== 8) {
      alert("Le numéro de téléphone principal doit contenir exactement 8 chiffres.");
      return false;
    }

    for (let i = 0; i < formData.contactsUrgence.length; i++) {
      const contact = formData.contactsUrgence[i];
      if (contact.telephone && contact.telephone.length !== 8) {
        alert(`Le numéro de téléphone du contact d'urgence ${i + 1} doit contenir exactement 8 chiffres.`);
        return false;
      }
    }

    for (let i = 0; i < formData.references.length; i++) {
      const reference = formData.references[i];
      if (reference.contact && reference.contact.length !== 8) {
        alert(`Le numéro de contact de la référence ${i + 1} doit contenir exactement 8 chiffres.`);
        return false;
      }
    }

    return true;
  };

  // 🔹 Soumission
  const handleSubmit = async () => {
    try {
      if (!user) {
        alert("Utilisateur non identifié !");
        return;
      }

      if (!validatePhoneNumbers()) {
        return;
      }

      setLoading(true);

      let signatureDataURL = "";
      if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
        signatureDataURL = sigPadRef.current.toDataURL();
      }

      const form = new FormData();
      form.append("userId", user._id || user.id);
      form.append("telephone", formData.telephone || "");
      form.append("adresse", formData.adresse || "");
      form.append("consentement", formData.consentement);
      form.append("contactsUrgence", JSON.stringify(formData.contactsUrgence || []));
      form.append("references", JSON.stringify(formData.references || []));

      if (formData.photoFile) {
        form.append("photo", formData.photoFile);
      }

      if (signatureDataURL) {
        const response = await fetch(signatureDataURL);
        const blob = await response.blob();
        form.append("signature", blob, "signature.png");
      }

      const res = await fetch(`https://agrivision-holding.onrender.com/api/info-post-entretien/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || "Erreur serveur");
      }

      setShowSuccessPopup(true);
    } catch (err) {
      alert("Erreur lors de l'enregistrement: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#094363] mb-2">Informations Complémentaires</h1>
          <p className="text-gray-600">Dernière étape de votre candidature</p>
        </div>

        {/* Infos personnelles */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#094363] mb-4">Informations personnelles</h2>
          
          {/* Indicateur de chargement des données */}
          {dataLoading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Récupération de vos informations précédentes...
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input value={formData.nom} disabled className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénoms</label>
              <input value={formData.prenoms} disabled className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={formData.email} disabled className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-[#094363] text-white border border-[#094363] rounded-l-md">+229</span>
                <input 
                  value={formData.telephone} 
                  onChange={handleTelephoneChange} 
                  placeholder="Téléphone (8 chiffres)"
                  maxLength={8}
                  className="flex-1 p-3 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:border-[#094363]"
                  disabled={dataLoading}
                />
              </div>
              {!dataLoading && formData.telephone && formData.telephone.length === 8 && !isPhoneFromDB && (
                <p className="text-xs text-green-600 mt-1">✓ Numéro valide</p>
              )}
              {!dataLoading && formData.telephone && isPhoneFromDB && (
                <p className="text-xs text-green-600 mt-1">✓ Récupéré automatiquement</p>
              )}
              {!dataLoading && !isPhoneFromDB && formData.telephone && formData.telephone.length > 0 && formData.telephone.length < 8 && (
                <p className="text-xs text-red-600 mt-1">⚠ Le numéro doit contenir exactement 8 chiffres</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input 
                value={formData.adresse} 
                name="adresse" 
                onChange={handleChange} 
                placeholder="Votre adresse complète" 
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                disabled={dataLoading}
              />
              {!dataLoading && formData.adresse && (
                <p className="text-xs text-green-600 mt-1">✓ Vos infos ont été récupéré automatiquement</p>
              )}
            </div>
          </div>
        </div>

        {/* Contacts d'urgence */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-[#094363]">Contacts d'urgence</h2>
            <button onClick={addContactUrgence} className="px-4 py-2 bg-[#16a34a] text-white rounded-md hover:bg-green-700 text-sm">+ Ajouter</button>
          </div>
          
          {formData.contactsUrgence.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun contact d'urgence ajouté</p>
          ) : (
            <div className="space-y-4">
              {formData.contactsUrgence.map((c, i) => (
                <div key={i} className="border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input 
                      value={c.nom} 
                      onChange={(e) => handleContactUrgenceChange(i, "nom", e.target.value)} 
                      placeholder="Nom" 
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                    />
                    <input 
                      value={c.prenom} 
                      onChange={(e) => handleContactUrgenceChange(i, "prenom", e.target.value)} 
                      placeholder="Prénom" 
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                    />
                    <input 
                      value={c.relation} 
                      onChange={(e) => handleContactUrgenceChange(i, "relation", e.target.value)} 
                      placeholder="Relation" 
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input 
                          value={c.telephone} 
                          onChange={(e) => handleContactUrgenceChange(i, "telephone", e.target.value)} 
                          placeholder="Téléphone (8 chiffres)"
                          maxLength={8}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                        />
                        {c.telephone && c.telephone.length > 0 && c.telephone.length < 8 && (
                          <p className="text-xs text-red-600 mt-1">8 chiffres requis</p>
                        )}
                      </div>
                      <button 
                        onClick={() => removeContactUrgence(i)} 
                        className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Références */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-[#094363]">Références professionnelles</h2>
            <button onClick={addReference} className="px-4 py-2 bg-[#16a34a] text-white rounded-md hover:bg-green-700 text-sm">+ Ajouter</button>
          </div>
          
          {formData.references.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune référence ajoutée</p>
          ) : (
            <div className="space-y-4">
              {formData.references.map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input 
                      value={r.nom} 
                      onChange={(e) => handleReferenceChange(i, "nom", e.target.value)} 
                      placeholder="Nom complet" 
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                    />
                    <input 
                      value={r.poste} 
                      onChange={(e) => handleReferenceChange(i, "poste", e.target.value)} 
                      placeholder="Poste" 
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input 
                          value={r.contact} 
                          onChange={(e) => handleReferenceChange(i, "contact", e.target.value)} 
                          placeholder="Téléphone (8 chiffres)"
                          maxLength={8}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#094363]"
                        />
                        {r.contact && r.contact.length > 0 && r.contact.length < 8 && (
                          <p className="text-xs text-red-600 mt-1">8 chiffres requis</p>
                        )}
                      </div>
                      <button 
                        onClick={() => removeReference(i)} 
                        className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photo et Signature */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Photo */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#094363] mb-4">Photo d'identité</h2>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full p-2 border border-gray-300 rounded-md mb-3"/>
            {formData.photoPreview && (
              <div className="flex justify-center">
                <img src={formData.photoPreview} alt="Aperçu" className="w-24 h-24 object-cover rounded-md border"/>
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#094363] mb-4">Signature électronique</h2>
            <div className="border border-gray-300 rounded-md mb-3">
              <SignatureCanvas ref={sigPadRef} penColor="black" canvasProps={{ width: 300, height: 120, className: "w-full h-auto" }}/>
            </div>
            <button onClick={clearSignature} className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">Effacer</button>
          </div>
        </div>

        {/* Consentement et Soumission */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-3 mb-6">
            <input type="checkbox" checked={formData.consentement} onChange={handleConsent} className="mt-1 w-4 h-4 text-[#094363] border-gray-300 rounded"/>
            <div>
              <p className="text-sm text-gray-700">
                Je consens à l'utilisation de mes informations personnelles dans le cadre de ma candidature.
              </p>
            </div>
          </div>
          
          <button onClick={handleSubmit} disabled={loading || !formData.consentement || dataLoading} className={`w-full py-3 px-4 font-medium rounded-md transition-colors ${loading || !formData.consentement || dataLoading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#094363] text-white hover:bg-blue-700"}`}>
            {loading ? "Enregistrement..." : dataLoading ? "Chargement des données..." : "Finaliser ma candidature"}
          </button>
        </div>
      </div>

      {/* Popup de succès */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-[#16a34a] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold text-[#094363] mb-3">Candidature finalisée !</h3>
            <p className="text-gray-600 mb-4 text-sm">Votre candidature a été soumise avec succès. Vous recevrez une confirmation par email.</p>
            <button onClick={handleSuccessClose} className="w-full py-2 px-4 bg-[#094363] text-white rounded-md hover:bg-blue-700">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useRef, useContext, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { AuthContext } from "../contexts/authContext";

export default function InfoPostEntretien() {
  const { user, token, logout } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    telephone: user?.telephone || "",
    adresse: "",
    photo: null,
    signature: null,
    contactsUrgence: [],
    references: [],
    consentement: false,
  });

  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const sigCanvas = useRef(null);

  // Gérer changement des champs classiques
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Signature
  const clearSignature = () => {
    sigCanvas.current.clear();
    setFormData((prev) => ({ ...prev, signature: null }));
  };

  const saveSignature = () => {
    if (!sigCanvas.current.isEmpty()) {
      setFormData((prev) => ({
        ...prev,
        signature: sigCanvas.current.getTrimmedCanvas().toDataURL("image/png"),
      }));
    }
  };

  // Consentement
  const handleConsent = (e) => {
    setFormData((prev) => ({ ...prev, consentement: e.target.checked }));
  };

  // Gestion contacts d'urgence
  const addContactUrgence = () => {
    setFormData((prev) => ({
      ...prev,
      contactsUrgence: [...prev.contactsUrgence, { nom: "", telephone: "" }],
    }));
  };

  const handleContactUrgenceChange = (i, field, value) => {
    const newContacts = [...formData.contactsUrgence];
    newContacts[i][field] = value;
    setFormData((prev) => ({ ...prev, contactsUrgence: newContacts }));
  };

  const removeContactUrgence = (i) => {
    const newContacts = formData.contactsUrgence.filter((_, idx) => idx !== i);
    setFormData((prev) => ({ ...prev, contactsUrgence: newContacts }));
  };

  // Gestion références
  const addReference = () => {
    setFormData((prev) => ({
      ...prev,
      references: [...prev.references, { nom: "", contact: "" }],
    }));
  };

  const handleReferenceChange = (i, field, value) => {
    const newRefs = [...formData.references];
    newRefs[i][field] = value;
    setFormData((prev) => ({ ...prev, references: newRefs }));
  };

  const removeReference = (i) => {
    const newRefs = formData.references.filter((_, idx) => idx !== i);
    setFormData((prev) => ({ ...prev, references: newRefs }));
  };

  // Soumission
  const handleSubmit = async () => {
    // ✅ Validation uniquement pour contactsUrgence & références
    for (let i = 0; i < formData.contactsUrgence.length; i++) {
      const contact = formData.contactsUrgence[i];
      if (contact.telephone && contact.telephone.length !== 10) {
        alert(
          `Le numéro de téléphone du contact d'urgence ${i + 1} doit contenir exactement 10 chiffres.`
        );
        return;
      }
    }

    for (let i = 0; i < formData.references.length; i++) {
      const ref = formData.references[i];
      if (ref.contact && ref.contact.length !== 10) {
        alert(
          `Le numéro de téléphone de la référence ${i + 1} doit contenir exactement 10 chiffres.`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const body = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "contactsUrgence" || key === "references") {
          body.append(key, JSON.stringify(formData[key]));
        } else {
          if (formData[key]) body.append(key, formData[key]);
        }
      });

      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (!res.ok) throw new Error("Erreur serveur");
      setShowSuccessPopup(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#094363] mb-4">
        Informations post-entretien
      </h1>

      <div className="space-y-6">
        {/* Upload photo */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-gray-700 mb-2">Photo</label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        {/* Adresse */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-gray-700 mb-2">Adresse</label>
          <input
            type="text"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Signature */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-gray-700 mb-2">Signature</label>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: 500,
              height: 200,
              className: "border rounded-md",
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={clearSignature}
              type="button"
              className="px-4 py-2 bg-red-100 text-red-600 rounded-md"
            >
              Effacer
            </button>
            <button
              onClick={saveSignature}
              type="button"
              className="px-4 py-2 bg-green-100 text-green-600 rounded-md"
            >
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Contacts d'urgence */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Contacts d'urgence
            </h2>
            <button
              onClick={addContactUrgence}
              type="button"
              className="px-3 py-1 bg-[#094363] text-white rounded-md"
            >
              + Ajouter
            </button>
          </div>
          {formData.contactsUrgence.map((c, i) => (
            <div
              key={i}
              className="flex gap-2 items-center mb-2 bg-gray-50 p-2 rounded-md"
            >
              <input
                type="text"
                placeholder="Nom"
                value={c.nom}
                onChange={(e) =>
                  handleContactUrgenceChange(i, "nom", e.target.value)
                }
                className="flex-1 border rounded-md px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Téléphone (10 chiffres)"
                value={c.telephone}
                onChange={(e) =>
                  handleContactUrgenceChange(i, "telephone", e.target.value)
                }
                className="flex-1 border rounded-md px-3 py-2"
              />
              <button
                onClick={() => removeContactUrgence(i)}
                type="button"
                className="p-2 bg-red-100 text-red-600 rounded-md"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Références */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Références</h2>
            <button
              onClick={addReference}
              type="button"
              className="px-3 py-1 bg-[#094363] text-white rounded-md"
            >
              + Ajouter
            </button>
          </div>
          {formData.references.map((r, i) => (
            <div
              key={i}
              className="flex gap-2 items-center mb-2 bg-gray-50 p-2 rounded-md"
            >
              <input
                type="text"
                placeholder="Nom"
                value={r.nom}
                onChange={(e) =>
                  handleReferenceChange(i, "nom", e.target.value)
                }
                className="flex-1 border rounded-md px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Contact (10 chiffres)"
                value={r.contact}
                onChange={(e) =>
                  handleReferenceChange(i, "contact", e.target.value)
                }
                className="flex-1 border rounded-md px-3 py-2"
              />
              <button
                onClick={() => removeReference(i)}
                type="button"
                className="p-2 bg-red-100 text-red-600 rounded-md"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Consentement */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.consentement}
              onChange={handleConsent}
              className="h-4 w-4 text-[#094363] rounded"
            />
            <span className="text-gray-700">
              J'accepte que mes informations soient utilisées dans le cadre du
              processus de recrutement.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-[#094363] text-white rounded-md hover:bg-[#07314a] disabled:opacity-50"
          >
            {loading ? "Envoi en cours..." : "Soumettre"}
          </button>
        </div>

        {/* Popup de succès */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h2 className="text-lg font-semibold mb-2">Succès !</h2>
              <p className="text-gray-600 mb-4">
                Vos informations ont été enregistrées avec succès.
              </p>
              <button
                onClick={handleSuccessClose}
                className="px-4 py-2 bg-[#094363] text-white rounded-md hover:bg-[#07314a]"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

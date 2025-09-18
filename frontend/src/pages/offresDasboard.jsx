import { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiUsers } from "react-icons/fi";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

export default function Offres() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [offerToEdit, setOfferToEdit] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    dateLimite: "",
    statut: "Ouverte",
  });

  // ⚡ Charger les offres existantes et mettre à jour leur statut
  useEffect(() => {
    const fetchOffres = async () => {
      try {
        const res = await fetch(`https://agrivision-holding.onrender.com/api/offres`);
        let data = await res.json();

        const updatedData = data.map((offre) => {
          if (!offre.dateLimite) return offre;
          const now = new Date();
          const limite = new Date(offre.dateLimite);
          if (limite < now) return { ...offre, statut: "Expirée" };
          return offre;
        });

        setOffres(updatedData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOffres();
  }, []);

  // Couleur selon statut
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "Ouverte":
        return "bg-emerald-50 text-emerald-700";
      case "Expirée":
        return "bg-gray-100 text-gray-500";
      case "Prochaine":
        return "bg-yellow-50 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  // ⚡ Fonction pour afficher notification
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ⚡ Soumettre création ou modification
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre || !form.description) return;

    setLoading(true);
    try {
      const url = offerToEdit ? `https://agrivision-holding.onrender.com/api/offres/${offerToEdit._id}` : `https://agrivision-holding.onrender.com/api/offres`;
      const method = offerToEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur serveur");

      if (data.dateLimite) {
        const limite = new Date(data.dateLimite);
        if (limite < new Date()) data.statut = "Expirée";
      }

      if (offerToEdit) {
        setOffres(offres.map((o) => (o._id === data._id ? data : o)));
        showNotification("Votre offre a été modifiée avec succès");
      } else {
        setOffres([data, ...offres]);
        showNotification("Votre offre a été créée avec succès");
      }

      setShowModal(false);
      setOfferToEdit(null);
      setForm({ titre: "", description: "", dateLimite: "", statut: "Ouverte" });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Supprimer une offre
  const handleDelete = async () => {
    if (!offerToDelete) return;
    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/offres/${offerToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setOffres(offres.filter((o) => o._id !== offerToDelete._id));
      showNotification("Votre offre a été supprimée avec succès");
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    } finally {
      setOfferToDelete(null);
    }
  };

  // ⚡ Ouvrir modal pour modifier
  const openEditModal = (offre) => {
    setForm({
      titre: offre.titre,
      description: offre.description,
      dateLimite: offre.dateLimite?.slice(0, 10) || "",
      statut: offre.statut,
    });
    setOfferToEdit(offre);
    setShowModal(true);
  };

  return (
    <div className="space-y-4 px-2 sm:px-4 py-6 max-w-6xl mx-auto relative">
      {/* Pop-up notification */}
      {notification && (
        <div className="fixed inset-0 flex items-start justify-center z-50 pointer-events-none">
          <div className="mt-20 bg-green-600 text-white px-6 py-3 rounded shadow-lg animate-slide-fade">
            {notification}
          </div>
        </div>
      )}

      {/* Bouton Créer une offre */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setForm({ titre: "", description: "", dateLimite: "", statut: "Ouverte" });
            setOfferToEdit(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded bg-green-600 text-white hover:opacity-90 transition"
        >
          Créer une offre
        </button>
      </div>

      {/* Modal création/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold mb-4">
              {offerToEdit ? "Modifier l'offre" : "Créer une offre"}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium text-gray-700">Titre du poste</label>
                <input
                  type="text"
                  placeholder="Ex: Chargé de communication"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className="border rounded-lg p-3 text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#094363] focus:border-[#094363] outline-none w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Description du poste"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="border rounded-lg p-3 text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#094363] focus:border-[#094363] outline-none w-full resize-none h-24"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium text-gray-700">Date limite (optionnelle)</label>
                <input
                  type="date"
                  value={form.dateLimite}
                  onChange={(e) => setForm({ ...form, dateLimite: e.target.value })}
                  className="border rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-[#094363] focus:border-[#094363] outline-none w-full"
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#094363] text-[#094363] hover:bg-[#094363] hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#094363] text-white hover:opacity-90 transition"
                >
                  {loading ? "En cours..." : offerToEdit ? "Sauvegarder" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {offerToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
            <p className="mb-4">Êtes-vous sûr de vouloir supprimer cette offre ?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setOfferToDelete(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Non
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des offres */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {offres.map((offre) => (
          <article
            key={offre._id}
            className="bg-white rounded-xl border p-4 sm:p-5 shadow-sm hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-sm sm:text-base truncate">{offre.titre || "Titre non défini"}</h3>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              Date limite : {offre.dateLimite ? offre.dateLimite.slice(0, 10) : "Non définie"}
            </div>
            <div className={`mt-3 px-2 py-1 rounded text-xs ${getStatusColor(offre.statut)}`}>
              {offre.statut || "Non défini"}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <button
                onClick={() => openEditModal(offre)}
                className="flex items-center gap-1 hover:text-gray-900 transition"
              >
                <FiEdit className="text-base" /> Modifier
              </button>
              <span className="text-gray-400">/</span>
              <button
                 onClick={() => navigate(`/admin/offres/${offre._id}/candidatures`)}
                className="flex items-center gap-1 hover:text-gray-900 transition"
              >
                <FiUsers className="text-base" /> Voir candidatures
              </button>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => setOfferToDelete(offre)}
                className="flex items-center gap-1 text-red-600 hover:text-red-800 transition"
              >
                <FiTrash2 className="text-base" /> Supprimer
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* Animation CSS */}
      <style>
        {`
        @keyframes slideFade {
          0% { transform: translateY(-50px); opacity: 0; }
          50% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        .animate-slide-fade { animation: slideFade 3s ease forwards; }
        `}
      </style>
    </div>
  );
}

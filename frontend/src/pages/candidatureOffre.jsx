import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import CandidatureCard from "../components/canditatCard";

export default function CandidaturesOffre() {
  const { id } = useParams(); // /admin/offres/:id/candidatures
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidatures = async () => {
      try {
        setLoading(true);
        const start = Date.now();

        const token = localStorage.getItem("token");

        // ✅ Utilisation des backticks pour l'interpolation
        // ✅ Ou proxy Vite si tu préfères
        const res = await fetch(`https://agrivision-holding.onrender.com/api/candidats/offre/${id}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        setCandidatures(data);

        // Minimum 500ms pour voir le skeleton
        const elapsed = Date.now() - start;
        if (elapsed < 500) await new Promise((r) => setTimeout(r, 500 - elapsed));
      } catch (error) {
        console.error("Erreur lors du chargement des candidatures :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidatures();
  }, [id]);

  // Skeleton card
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl p-4 shadow animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div className="h-6 bg-gray-300 rounded w-1/4 mt-4"></div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Candidatures pour l'offre</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
          : candidatures.length === 0
          ? <p>Aucune candidature pour cette offre.</p>
          : candidatures.map((candidat) => (
              <CandidatureCard key={candidat._id} candidat={candidat} />
            ))}
      </div>
    </div>
  );
}

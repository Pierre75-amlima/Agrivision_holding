import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  Users, 
  Briefcase, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight
} from "lucide-react";
import StatCard from "../components/startCard";
import { useAuth } from "../contexts/authContext";

export default function Dashboard() {
  const { token } = useAuth();
  const [allCandidatures, setAllCandidatures] = useState([]);
  const [latestCandidatures, setLatestCandidatures] = useState([]);
  const [stats, setStats] = useState([]);
  const [repartition, setRepartition] = useState([]);
  const [offresCount, setOffresCount] = useState(0);
  const pieColors = ["#094363", "#026530", "#0284c7", "#059669"];

  useEffect(() => {
    if (!token) return;

    const fetchCandidatures = async () => {
      try {
        const res = await fetch(`https://agrivision-holding.onrender.com/api/candidats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401)
          throw new Error("Non autorisé. Veuillez vous reconnecter.");

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Les données des candidatures ne sont pas un tableau :", data);
          return;
        }

        setAllCandidatures(data);
        setLatestCandidatures(data.slice(0, 5));

        // Stats mensuelles
        const moisMap = {};
        data.forEach((c) => {
          const date = new Date(c.createdAt || c.dateCreation || Date.now());
          const mois = date.toLocaleString("fr-FR", { month: "short" });
          if (!moisMap[mois]) moisMap[mois] = 0;
          moisMap[mois]++;
        });
        setStats(Object.keys(moisMap).map((m) => ({ mois: m, candidatures: moisMap[m] })));

        // Répartition par poste
        const repartMap = {};
        data.forEach((c) => {
          const poste = c.poste || c.offre?.titre || "Non défini";
          if (!repartMap[poste]) repartMap[poste] = 0;
          repartMap[poste]++;
        });
        setRepartition(Object.keys(repartMap).map((p) => ({ poste: p, count: repartMap[p] })));
      } catch (err) {
        console.error("Erreur fetch candidatures:", err);
      }
    };

    const fetchOffres = async () => {
      try {
        const res = await fetch(`https://agrivision-holding.onrender.com/api/offres`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401)
          throw new Error("Non autorisé. Veuillez vous reconnecter.");

        const data = await res.json();
        if (!Array.isArray(data)) return;

        setOffresCount(data.length);
      } catch (err) {
        console.error("Erreur fetch offres:", err);
      }
    };

    fetchCandidatures();
    fetchOffres();
  }, [token]);

  const getStatusIcon = (statut) => {
    switch (statut) {
      case "Test réussi":
        return <CheckCircle className="w-4 h-4 text-[#026530]" />;
      case "Test en cours":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Test échoué":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête amélioré */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#094363] to-[#026530] bg-clip-text text-transparent">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-600">Vue d'ensemble de vos candidatures, vos offres d'emploi et vos tests</p>
        </div>

        {/* Stats avec animations */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <StatCard
              label="Candidatures totales"
              value={allCandidatures.length}
              type="candidatures"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <StatCard 
              label="Offres actives" 
              value={offresCount} 
              type="offres"
            />
          </div>
        </section>

        {/* Graphiques modernisés */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Candidatures / mois */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 p-6 min-h-[280px] animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#094363]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Candidatures / mois</h3>
            </div>
            
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats}>
                <XAxis 
                  dataKey="mois" 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="candidatures" 
                  stroke="#094363" 
                  strokeWidth={3}
                  dot={{ fill: '#094363', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#094363', strokeWidth: 2, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par poste */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 p-6 min-h-[280px] animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-[#026530]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Répartition par poste</h3>
            </div>
            
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={repartition}
                  dataKey="count"
                  nameKey="poste"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {repartition.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={pieColors[index % pieColors.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Légende modernisée */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              {repartition.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pieColors[i % pieColors.length] }}
                  />
                  <span className="text-gray-700 truncate flex-1">{r.poste}</span>
                  <span className="text-gray-500 font-medium">({r.count})</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dernières candidatures */}
        <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 overflow-hidden animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-[#094363]" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Dernières candidatures</h2>
            </div>
            <a 
              href="/admin/candidatures" 
              className="flex items-center gap-2 text-[#026530] hover:text-[#024d29] transition-colors group"
            >
              <span className="text-sm font-medium">Voir plus</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="divide-y divide-gray-100">
            {latestCandidatures.map((c, i) => {
              let badgeStyle = "bg-gray-100 text-gray-700";
              if (c.statut === "Test réussi") badgeStyle = "bg-[#026530]/10 text-[#026530] border border-[#026530]/20";
              if (c.statut === "Test échoué") badgeStyle = "bg-red-50 text-red-700 border border-red-200";
              if (c.statut === "Test en cours") badgeStyle = "bg-yellow-50 text-yellow-700 border border-yellow-200";

              return (
                <div
                  key={i}
                  className="p-6 hover:bg-gray-50/50 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#094363] to-[#026530] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {c.user?.prenom?.[0] || 'N'}{c.user?.nom?.[0] || 'A'}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 group-hover:text-[#094363] transition-colors">
                          {c.user?.prenom} {c.user?.nom}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {c.poste || c.offre?.titre}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${badgeStyle}`}>
                        {getStatusIcon(c.statut)}
                        {c.statut || "En attente"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          opacity: 0;
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
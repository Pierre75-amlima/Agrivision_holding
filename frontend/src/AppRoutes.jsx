// AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import CandidaturePage from './pages/candidaturePage';
import Modal from './components/modal';
import AdminLayout from "./components/layoutDashboard";
import Dashboard from "./pages/dashboardAdmin";
import Candidatures from "./pages/CandidatureAdmin";
import Offres from "./pages/offresDasboard";
import Tests from "./pages/TestDashboard";
import ProtectedRoute from "./components/protectedRoute";
import ProfilDetail from "./pages/profilDetail";
import CandidaturesOffre from "./pages/candidatureOffre"; // ✅ nouvelle page
import AllOffres from './pages/allOffres';
import InfoPosteEntretien from './pages/infoPostEntretien';
import TestPage from './pages/testResultPage';
import ChangePassword from './pages/changePassword'; 
import Notifications from "./pages/notification";
import AboutPage from './pages/AboutPage';

const AppRoutes = () => {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/candidature/:offreId" element={<CandidaturePage />} />
        <Route path="/offres" element={<AllOffres />} />
        <Route path="/infoPosteEntretien/:candidatureId" element={<InfoPosteEntretien />} />
        <Route path="/testResults/:offreId" element={<TestPage />} />
        <Route path="/change-password" element={<ChangePassword />} />
         <Route path="/about" element={<AboutPage />} />
        

        {/* Admin - Protégé */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/candidatures" element={<Candidatures />} />
          <Route path="/admin/offres" element={<Offres />} />
          <Route path="/admin/tests" element={<Tests />} />
          <Route path="/admin/notifications" element={<Notifications />} />

          {/* 🔹 Nouvelle route pour voir les candidatures liées à une offre */}
          <Route path="/admin/offres/:id/candidatures" element={<CandidaturesOffre />} />

          {/* 🔹 Détail d’une candidature */}
          <Route path="/candidatures/:id" element={<ProfilDetail />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-6">Page introuvable.</div>} />
      </Routes>

      <Modal />
    </>
  );
};

export default AppRoutes;

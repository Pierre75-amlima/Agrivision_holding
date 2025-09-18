// src/components/LoginForm.jsx
import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { useModal } from "../contexts/modalContext";

export default function LoginForm({ switchToSignup, onClose, offreId }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { prefillEmail, setPrefillEmail, closeModal, openSignupModal, setAuthMode } = useModal();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const uniqueSuffix = Math.random().toString(36).substring(2, 7);
  const inputIdEmail = `loginEmail_${uniqueSuffix}`;
  const inputIdPassword = `loginPassword_${uniqueSuffix}`;

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
    return () => {
      if (typeof setPrefillEmail === "function") setPrefillEmail("");
    };
  }, [prefillEmail, setPrefillEmail]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), motDePasse: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de connexion");

      const { token, user } = data;
      login(token, user);

      if (typeof closeModal === "function") closeModal();
      else if (typeof onClose === "function") onClose();

      if (user?.mustChangePassword) {
        navigate("/change-password");
        return;
      }
      if (user?.role === "admin") {
        navigate("/admin");
        return;
      }

      const pendingOffreId = localStorage.getItem("pendingOffreId");
      if (pendingOffreId) {
        localStorage.removeItem("pendingOffreId");
        navigate(`/candidature/${pendingOffreId}`);
        return;
      }

      if (offreId) navigate(`/candidature/${offreId}`);
      else navigate("/offres");
    } catch (err) {
      setMessage(err.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSignup = () => {
    // Prioritise les fonctions du contexte modal pour ouvrir le signup
    if (typeof setAuthMode === "function") setAuthMode("signup");
    if (typeof openSignupModal === "function") openSignupModal();
    // fallback: appeler la prop si fournie (compatibilité)
    if (typeof switchToSignup === "function") switchToSignup();
  };

  return (
    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-[#e6f0f7] p-8 rounded-l-2xl">
        <img src="login.jpg" alt="Connexion illustration" className="w-full max-w-[250px] rounded-xl" />
      </div>

      <form onSubmit={handleLogin} className="flex-1 p-8 flex flex-col overflow-y-auto max-h-[90vh]">
        <h2 className="mb-6 text-gray-800 font-bold text-2xl">Se connecter</h2>

        {message && <div className="mb-4 text-sm text-red-600">{message}</div>}

        <label htmlFor={inputIdEmail} className="mt-3 mb-1 text-gray-700 font-semibold text-sm">Email</label>
        <input
          type="email"
          id={inputIdEmail}
          name="email"
          placeholder="exemple@mail.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-lg border border-gray-300 text-base w-full outline-none focus:border-[#094363] transition"
        />

        <label htmlFor={inputIdPassword} className="mt-4 mb-1 text-gray-700 font-semibold text-sm">Mot de passe</label>
        <div className="relative flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            id={inputIdPassword}
            name="motDePasse"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg border border-gray-300 text-base w-full outline-none focus:border-[#094363] transition"
          />
          <span className="absolute right-3 text-gray-500 cursor-pointer text-lg" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>
          {/* <button
  type="button"
    onClick={() => {
    if (typeof closeModal === "function") closeModal(); // 🔹 ferme le modal
    navigate("/change-password"); // 🔹 puis redirige
  }}
  className="text-[#DC143C] text-sm font-semibold underline mt-2"
>
  Mot de passe oublié ?
</button> */}
        <button
          type="submit"
          disabled={loading}
          className={`mt-8 bg-[#094363] hover:bg-blue-800 text-white py-3 rounded-xl font-bold text-lg transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <div className="mt-4 text-sm text-gray-700">
          Pas encore de compte ?{" "}
          <button type="button" onClick={handleOpenSignup} className="text-[#026530] font-semibold underline">
            Créez-en un
          </button>
        </div>
      </form>
    </div>
  );
}

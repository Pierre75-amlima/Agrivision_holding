// src/components/SignUpForm.jsx
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useModal } from "../contexts/modalContext";

export default function SignUpForm({ switchToLogin, onRegister }) {
  const { setAuthMode, setPrefillEmail, openLoginModal } = useModal();

  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    email: "",
    motDePasse: "",
    confirmmotDePasse: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.motDePasse !== formData.confirmmotDePasse) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const res = await fetch("https://agrivision-holding.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          prenoms: formData.prenoms,
          email: formData.email,
          motDePasse: formData.motDePasse,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de l'inscription");

      // Inscription réussie -> ne pas auto-login
      // Préparer le formulaire de login : basculer en mode 'login' et pré-remplir l'email
      if (typeof setPrefillEmail === "function") setPrefillEmail(formData.email);
      if (typeof setAuthMode === "function") setAuthMode("login");

      // si modal gère l'ouverture séparément, on peut appeler openLoginModal pour s'assurer qu'il est visible
      if (typeof openLoginModal === "function") openLoginModal();

      setMessage("Inscription réussie. Veuillez vous connecter.");

      if (typeof onRegister === "function") onRegister(data);

      setFormData({ nom: "", prenoms: "", email: "", motDePasse: "", confirmmotDePasse: "" });
    } catch (err) {
      setMessage(err.message || "Erreur serveur");
    }
  };

  const handleSwitchToLogin = () => {
    // Pré-remplir l'email courant (utile si l'utilisateur a déjà saisi son email)
    if (typeof setPrefillEmail === "function") setPrefillEmail(formData.email || "");
    if (typeof setAuthMode === "function") setAuthMode("login");
    if (typeof openLoginModal === "function") openLoginModal();
    // fallback à la prop parent si fournie
    if (typeof switchToLogin === "function") switchToLogin();
  };

  return (
    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-[#094363] p-6">
        <img src="signup.jpg" alt="Inscription illustration" className="w-full max-w-xs rounded-xl" />
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Créer un compte</h2>
        {message && <div className="mb-4 text-sm text-green-600">{message}</div>}

        <label className="text-sm font-medium text-gray-700">Nom</label>
        <input name="nom" value={formData.nom} onChange={handleChange} required className="mb-4 mt-1 p-3 rounded-lg border w-full focus:ring-2 focus:ring-[#094363]" />

        <label className="text-sm font-medium text-gray-700">Prénoms</label>
        <input name="prenoms" value={formData.prenoms} onChange={handleChange} required className="mb-4 mt-1 p-3 rounded-lg border w-full focus:ring-2 focus:ring-[#094363]" />

        <label className="text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mb-4 mt-1 p-3 rounded-lg border w-full focus:ring-2 focus:ring-[#094363]" />

        <label className="text-sm font-medium text-gray-700">Mot de passe</label>
        <div className="relative mb-4 mt-1">
          <input type={showPassword ? "text" : "password"} name="motDePasse" value={formData.motDePasse} onChange={handleChange} required className="p-3 pr-10 rounded-lg border w-full focus:ring-2 focus:ring-[#094363]" />
          <span onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500 cursor-pointer">
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        <label className="text-sm font-medium text-gray-700">Confirmer mot de passe</label>
        <div className="relative mb-6 mt-1">
          <input type={showConfirmPassword ? "text" : "password"} name="confirmmotDePasse" value={formData.confirmmotDePasse} onChange={handleChange} required className="p-3 pr-10 rounded-lg border w-full focus:ring-2 focus:ring-[#094363]" />
          <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-500 cursor-pointer">
            {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        <button type="submit" className="bg-[#094363] hover:bg-[#062e4c] text-white font-bold py-3 rounded-xl">S'inscrire</button>

        <div className="mt-4 text-sm text-gray-600">
          Vous avez déjà un compte ?{" "}
          <button type="button" onClick={handleSwitchToLogin} className="text-[#026530] font-semibold underline">
            Connectez-vous
          </button>
        </div>
      </form>
    </div>
  );
}

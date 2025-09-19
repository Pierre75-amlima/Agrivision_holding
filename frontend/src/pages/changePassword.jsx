// src/pages/changePassword.jsx
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

export default function ChangePassword() {
  const { authFetch, markPasswordChanged, user } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "error" ou "success"
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    if (newPassword !== confirm) {
      setMsg("Les mots de passe ne correspondent pas.");
      setMsgType("error");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`https://agrivision-holding.onrender.com/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de mise à jour.");

      // Succès
      markPasswordChanged();
      setMsg("Mot de passe mis à jour avec succès !");
      setMsgType("success");

      // Redirection après un petit délai
      setTimeout(() => {
        if (user?.role === "admin") navigate("/admin");
        else navigate("/");
      }, 800);
    } catch (err) {
      setMsg(err.message);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden mx-auto mt-8">
      {/* Image gauche */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-[#e6f0f7] p-8 rounded-l-2xl">
        <img
          src="login.jpg"
          alt="Changer mot de passe illustration"
          className="w-full max-w-[250px] rounded-xl"
        />
      </div>

      {/* Formulaire */}
      <form
        onSubmit={submit}
        className="flex-1 p-8 flex flex-col overflow-y-auto max-h-[90vh]"
      >
        <h2 className="mb-6 text-gray-800 font-bold text-2xl">
          Changer votre mot de passe
        </h2>

        {/* Message */}
        {msg && (
          <div
            className={`mb-4 text-sm p-3 rounded-lg ${
              msgType === "error"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-green-100 text-green-700 border border-green-300"
            }`}
          >
            {msg}
          </div>
        )}

        {/* Ancien mot de passe */}
        <label className="mt-3 mb-1 text-gray-700 font-semibold text-sm">
          Ancien mot de passe
        </label>
        <div className="relative flex items-center">
          <input
            type={showOld ? "text" : "password"}
            placeholder="••••••••"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="p-3 rounded-lg border border-gray-300 text-base w-full outline-none focus:border-[#094363] transition"
          />
          <span
            className="absolute right-3 text-gray-500 cursor-pointer text-lg"
            onClick={() => setShowOld(!showOld)}
          >
            {showOld ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        {/* Nouveau mot de passe */}
        <label className="mt-4 mb-1 text-gray-700 font-semibold text-sm">
          Nouveau mot de passe
        </label>
        <div className="relative flex items-center">
          <input
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-3 rounded-lg border border-gray-300 text-base w-full outline-none focus:border-[#094363] transition"
          />
          <span
            className="absolute right-3 text-gray-500 cursor-pointer text-lg"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        {/* Confirmation mot de passe */}
        <label className="mt-4 mb-1 text-gray-700 font-semibold text-sm">
          Confirmer le mot de passe
        </label>
        <div className="relative flex items-center">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="p-3 rounded-lg border border-gray-300 text-base w-full outline-none focus:border-[#094363] transition"
          />
          <span
            className="absolute right-3 text-gray-500 cursor-pointer text-lg"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-8 bg-[#094363] hover:bg-blue-800 text-white py-3 rounded-xl font-bold text-lg transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}

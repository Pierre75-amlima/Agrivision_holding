// src/pages/TestsDashboard.jsx
import { useState, useEffect } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";

export default function TestsDashboard() {
  const [tests, setTests] = useState([]);
  const [offres, setOffres] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    duree: "",
    scoreMinimum: 0,
    offreId: "",
    questions: [{ question: "", options: [""], bonneReponse: "" }],
  });

  const [modifyModal, setModifyModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  // 🔹 Notification
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTests();
    fetchOffres();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/tests`);
      if (!res.ok) throw new Error("Erreur récupération tests");
      const data = await res.json();
      setTests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOffres = async () => {
    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/offres`);
      if (!res.ok) throw new Error("Erreur récupération offres");
      const data = await res.json();
      setOffres(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleQuestionChange = (qIndex, field, value, optIndex = null) => {
    const newQuestions = [...formData.questions];
    if (field === "option") {
      newQuestions[qIndex].options[optIndex] = value;
    } else {
      newQuestions[qIndex][field] = value;
    }
    setFormData({ ...formData, questions: newQuestions });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: "", options: [""], bonneReponse: "" }],
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (qIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push("");
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (qIndex, optIndex) => {
    const newQuestions = [...formData.questions];
    if (newQuestions[qIndex].options.length > 1) {
      newQuestions[qIndex].options.splice(optIndex, 1);
      setFormData({ ...formData, questions: newQuestions });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre || !formData.description || !formData.duree || !formData.offreId) {
      showNotification("Veuillez remplir tous les champs et choisir une offre.", "error");
      return;
    }
    for (const q of formData.questions) {
      if (!q.question || !q.bonneReponse || q.options.some((opt) => !opt)) {
        showNotification("Toutes les questions, options et la bonne réponse doivent être renseignées.", "error");
        return;
      }
    }

    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Erreur création test");
      setFormOpen(false);
      setFormData({
        titre: "",
        description: "",
        duree: "",
        scoreMinimum: 0,
        offreId: "",
        questions: [{ question: "", options: [""], bonneReponse: "" }],
      });
      fetchTests();
      showNotification("Test créé avec succès ", "success");
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de la création du test ", "error");
    }
  };

  const openModifyModal = (test) => setModifyModal(test);
  const openDeleteModal = (test) => setDeleteModal(test);
  const closeModals = () => {
    setModifyModal(null);
    setDeleteModal(null);
  };

  const handleUpdateTest = async (updatedTest) => {
    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/tests/${updatedTest._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTest),
      });
      if (!res.ok) throw new Error("Erreur mise à jour test");
      fetchTests();
      closeModals();
      showNotification("Test modifié avec succès ", "success");
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de la modification ", "error");
    }
  };

  const handleDeleteTest = async (id) => {
    try {
      const res = await fetch(`https://agrivision-holding.onrender.com/api/tests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur suppression test");
      fetchTests();
      closeModals();
      showNotification("Test supprimé avec succès ", "success");
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de la suppression ", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">

      {/* 🔹 Notification */}
      {notification && (
        <div className="fixed inset-0 flex items-start justify-center z-50 pointer-events-none">
          <div
            className={`mt-20 px-6 py-3 rounded shadow-lg animate-slide-fade text-white ${
              notification.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      {/* Bouton créer test */}
      <div className="flex justify-end">
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="px-4 py-2 rounded bg-green-600 text-white hover:opacity-90 transition"
        >
          {formOpen ? "Annuler" : "Créer un test"}
        </button>
      </div>

      
{formOpen && (
  <section className="bg-white border p-4 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold mb-4">Créer un test</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Champs classiques */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">Titre</label>
        <input
          name="titre"
          value={formData.titre}
          onChange={handleInputChange}
          className="border p-2 w-full"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="border p-2 w-full"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">Durée (minutes)</label>
        <input
          type="number"
          name="duree"
          value={formData.duree}
          onChange={handleInputChange}
          className="border p-2 w-full"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">Score minimum</label>
        <input
          type="number"
          name="scoreMinimum"
          value={formData.scoreMinimum}
          onChange={handleInputChange}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">Associer une offre</label>
        <select
          name="offreId"
          value={formData.offreId}
          onChange={handleInputChange}
          className="border p-2 w-full"
          required
        >
          <option value="">-- Choisir une offre --</option>
          {offres.map((o) => (
            <option key={o._id} value={o._id}>
              {o.titre}
            </option>
          ))}
        </select>
      </div>

      {/* Questions dynamiques */}
      <div>
        <h4 className="font-semibold mb-2">Questions</h4>
        {formData.questions.map((q, i) => (
          <div key={i} className="border p-4 mb-4 rounded-xl bg-gray-50 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Question #{i + 1}</span>
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-red-600 hover:underline text-sm"
              >
                Supprimer
              </button>
            </div>
            <input
              value={q.question}
              onChange={(e) => handleQuestionChange(i, "question", e.target.value)}
              placeholder="Texte de la question"
              className="border rounded p-2 w-full"
              required
            />
            {q.options.map((opt, j) => (
              <div key={j} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => handleQuestionChange(i, "option", e.target.value, j)}
                  placeholder={`Option ${j + 1}`}
                  className="border rounded p-2 w-full"
                  required
                />
                {q.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i, j)}
                    className="text-red-600 hover:underline px-2"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(i)}
              className="px-3 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 text-sm"
            >
              + Ajouter une option
            </button>

            <input
              value={q.bonneReponse}
              onChange={(e) => handleQuestionChange(i, "bonneReponse", e.target.value)}
              placeholder="Bonne réponse"
              className="border rounded p-2 w-full mt-2"
              required
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="px-4 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200"
        >
          + Ajouter une question
        </button>
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={() => setFormOpen(false)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Annuler
        </button>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
          Créer
        </button>
      </div>
    </form>
  </section>
)}

      

      {/* Liste des tests */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tests.map((test) => (
          <article key={test._id} className="bg-white border rounded p-4 shadow-sm">
            <h3 className="font-semibold">{test.titre}</h3>
            <div className="text-sm text-gray-500 mt-1">
              {test.duree} min • {test.questions.length} questions
            </div>
            {test.offreId && (
              <div className="mt-2 text-xs text-gray-600">
                Associé à : {test.offreId.titre || test.offreId}
              </div>
            )}
            <div className="mt-3 flex gap-2 flex-wrap text-xs">
              <span
                className={`px-2 py-1 rounded ${
                  test.scoreMinimum > 0 ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-600"
                }`}
              >
                Score minimum : {test.scoreMinimum}
              </span>
              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                {test.questions.length > 0 ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="mt-4 flex gap-2 text-sm items-center">
              <button
                onClick={() => openModifyModal(test)}
                className="flex items-center gap-1 text-gray-900 hover:text-green-600"
              >
                <FiEdit /> Modifier
              </button>
              <span>/</span>
              <button
                onClick={() => openDeleteModal(test)}
                className="flex items-center gap-1 text-gray-900 hover:text-red-600"
              >
                <FiTrash2 /> Supprimer
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* Modals */}
      {modifyModal && (
        <ModifyTestModal
          test={modifyModal}
          offres={offres}
          onClose={closeModals}
          onSave={handleUpdateTest}
        />
      )}
      {deleteModal && (
        <DeleteTestModal
          test={deleteModal}
          onClose={closeModals}
          onConfirm={handleDeleteTest}
        />
      )}

      {/* Animation CSS */}
      <style>
        {`
        @keyframes slideFade {
          0% { transform: translateY(-50px); opacity: 0; }
          20% { transform: translateY(0); opacity: 1; }
          80% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        .animate-slide-fade { animation: slideFade 3s ease forwards; }
        `}
      </style>
    </div>
  );
}

// ---------------- Modals ----------------

function ModifyTestModal({ test, offres, onClose, onSave }) {
  const [data, setData] = useState({
    ...test,
    offreId: test.offreId?._id || "",
  });

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleQuestionChange = (qIndex, field, value, optIndex = null) => {
    const newQuestions = [...data.questions];
    if (field === "option") {
      newQuestions[qIndex].options[optIndex] = value;
    } else {
      newQuestions[qIndex][field] = value;
    }
    setData({ ...data, questions: newQuestions });
  };

  const addQuestion = () => {
    setData({
      ...data,
      questions: [...data.questions, { question: "", options: [""], bonneReponse: "" }],
    });
  };

  const removeQuestion = (index) => {
    setData({
      ...data,
      questions: data.questions.filter((_, i) => i !== index),
    });
  };

  const addOption = (qIndex) => {
    const newQuestions = [...data.questions];
    newQuestions[qIndex].options.push("");
    setData({ ...data, questions: newQuestions });
  };

  const removeOption = (qIndex, optIndex) => {
    const newQuestions = [...data.questions];
    if (newQuestions[qIndex].options.length > 1) {
      newQuestions[qIndex].options.splice(optIndex, 1);
      setData({ ...data, questions: newQuestions });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-20 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-lg overflow-auto max-h-[80vh]">
        <h2 className="text-xl font-semibold mb-4">Modifier le test</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champs classiques */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">Titre</label>
            <input
              name="titre"
              value={data.titre}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium">Description</label>
            <textarea
              name="description"
              value={data.description}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium">Durée (minutes)</label>
            <input
              type="number"
              name="duree"
              value={data.duree}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium">Score minimum</label>
            <input
              type="number"
              name="scoreMinimum"
              value={data.scoreMinimum}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium">Associer une offre</label>
            <select
              name="offreId"
              value={data.offreId}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            >
              <option value="">-- Choisir une offre --</option>
              {offres.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Questions dynamiques */}
          <div>
            <h4 className="font-semibold mb-2">Questions</h4>
            {data.questions.map((q, i) => (
              <div key={i} className="border p-4 mb-4 rounded-xl bg-gray-50 space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Question #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Supprimer
                  </button>
                </div>
                <input
                  value={q.question}
                  onChange={(e) => handleQuestionChange(i, "question", e.target.value)}
                  placeholder="Texte de la question"
                  className="border rounded p-2 w-full"
                  required
                />
                {q.options.map((opt, j) => (
                  <div key={j} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => handleQuestionChange(i, "option", e.target.value, j)}
                      placeholder={`Option ${j + 1}`}
                      className="border rounded p-2 w-full"
                      required
                    />
                    {q.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i, j)}
                        className="text-red-600 hover:underline px-2"
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(i)}
                  className="px-3 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 text-sm"
                >
                  + Ajouter une option
                </button>

                <input
                  value={q.bonneReponse}
                  onChange={(e) => handleQuestionChange(i, "bonneReponse", e.target.value)}
                  placeholder="Bonne réponse"
                  className="border rounded p-2 w-full mt-2"
                  required
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200"
            >
              + Ajouter une question
            </button>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTestModal({ test, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg w-96 text-center">
        <h2 className="text-lg font-semibold mb-4">Supprimer ce test ?</h2>
        <p className="mb-4">Voulez-vous vraiment supprimer le test "{test.titre}" ?</p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Non
          </button>
          <button
            onClick={() => onConfirm(test._id)}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Oui
          </button>
        </div>
      </div>
    </div>
  );
}
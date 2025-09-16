import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Timer from "../components/timer";
import { AuthContext } from "../contexts/authContext";

const normalize = (str) =>
  str
    ? str
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "";

export default function TestPage() {
  const { offreId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [candidatureId, setCandidatureId] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const startTimeRef = useRef(null);

  const getUserIdFromContextOrToken = () => {
    if (user) {
      if (user._id) return user._id;
      if (user.id) return user.id;
    }
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload._id || null;
    } catch (e) {
      console.warn("Impossible de décoder le token:", e);
      return null;
    }
  };

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`https://agrivision-holding.onrender.com/api/tests/by-offre/${offreId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setTest({ message: "Aucun test associé à cette offre" });
            return;
          }
          const txt = await res.text();
          throw new Error(txt || `Erreur ${res.status}`);
        }

        const data = await res.json();
        const currentTest = data.test || data;
        setTest(currentTest);
      } catch (err) {
        console.error("Erreur fetchTest:", err);
        setTest({ message: "Erreur serveur lors de la récupération du test" });
      }
    };

    if (offreId) fetchTest();
  }, [offreId]);

  const startTest = () => {
    setTestStarted(true);
    startTimeRef.current = Date.now();
    window._testStartTime = startTimeRef.current;
  };

  const handleAnswerChange = (qIndex, value) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = async () => {
    if (!test || submitted) return;
    setSubmitted(true);

    const userId = getUserIdFromContextOrToken();
    if (!userId) {
      setResult({ message: "Utilisateur non identifié. Veuillez vous reconnecter." });
      setSubmitted(false);
      return;
    }

    try {
      const body = {
        reponses: Object.values(answers),
        offreId: test.offreId || offreId,
        startTime: startTimeRef.current || window._testStartTime || Date.now(),
      };

      const res = await fetch(
        `https://agrivision-holding.onrender.com/api/testResults/candidats/${userId}/tests/${test._id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        }
      );

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setResult({ message: data?.message || "Erreur serveur, veuillez réessayer." });
        setSubmitted(false);
        return;
      }

      setResult(data);
      setCandidatureId(data?.candidatureId || null);
    } catch (err) {
      console.error("Erreur soumission test:", err);
      setResult({ message: "Erreur serveur, veuillez réessayer." });
      setSubmitted(false);
    }
  };

  const handleTimeUp = () => {
    handleSubmit();
  };

  // Loading state
  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement du test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (test.message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Test non disponible</h3>
          <p className="text-gray-600">{test.message}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Result state
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg w-full">
          <div className="mb-6">
            {result.status === "reussi" && (
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {result.status === "temps_depasse" && (
              <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            {result.status === "echoue" && (
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {result.status === "reussi"
              ? "Test réussi !"
              : result.status === "temps_depasse"
              ? "Temps dépassé"
              : result.status === "echoue"
              ? "Test échoué"
              : "Test terminé"}
          </h2>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {typeof result.score === "number" ? result.score : "—"}<span className="text-lg text-gray-500">/20</span>
            </div>
            <p className="text-gray-600">Votre score final</p>
          </div>

          <p className="text-gray-600 mb-6">{result.message}</p>

          {candidatureId && (
            <button
              onClick={() => navigate(`/infoPosteEntretien/${candidatureId}`)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Continuer vers l'étape suivante
            </button>
          )}
        </div>
      </div>
    );
  }

  const questions = Array.isArray(test.questions) ? test.questions : [];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Pre-test instructions
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#094363] to-blue-700 px-8 py-6">
              <h1 className="text-2xl font-bold text-white">{test.titre}</h1>
              <p className="text-blue-100 mt-2">{test.description}</p>
            </div>

            {/* Instructions */}
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Instructions importantes
                </h2>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800">Durée du test</h3>
                    </div>
                    <p className="text-gray-600">
                      Vous disposez de <strong>{test.duree || 30} minutes</strong> pour compléter ce test.
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">{questions.length}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">Nombre de questions</h3>
                    </div>
                    <p className="text-gray-600">
                      Ce test contient <strong>{questions.length} questions</strong> à choix multiples.
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning message */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2">⚠️ Attention - Soumission automatique</h3>
                    <p className="text-amber-700 leading-relaxed">
                      <strong>Le test doit être terminé et soumis avant la fin du minuteur.</strong> 
                      Si le temps imparti s'écoule, vos réponses seront automatiquement envoyées dans l'état où elles se trouvent, 
                      même si toutes les questions ne sont pas complétées.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Retour
                </button>
                <button
                  onClick={startTest}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Commencer le test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test in progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{test.titre}</h1>
              <p className="text-gray-600 mt-1">
                Question {answeredCount} sur {questions.length} répondues
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Progress bar */}
              <div className="hidden sm:block">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1 text-center">{Math.round(progress)}%</p>
              </div>
              <Timer duration={(test.duree || 30) * 60} onTimeUp={handleTimeUp} />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Question header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-sm">{idx + 1}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Question {idx + 1}
                  </h3>
                  {answers[idx] && (
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Répondu
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Question content */}
              <div className="p-6">
                <p className="text-gray-800 mb-6 text-lg leading-relaxed">{q.question}</p>
                
                {/* Options */}
                <div className="space-y-3">
                  {Array.isArray(q.options) &&
                    q.options.map((opt, i) => (
                      <label 
                        key={i} 
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                          answers[idx] === opt 
                            ? 'border-blue-600 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-4 font-bold text-sm text-gray-600">
                            {String.fromCharCode(65 + i)}
                          </div>
                          <input
                            type="radio"
                            name={`q-${idx}`}
                            value={opt}
                            checked={answers[idx] === opt}
                            onChange={() => handleAnswerChange(idx, opt)}
                            disabled={submitted}
                            className="sr-only"
                          />
                          <span className={`text-gray-800 ${answers[idx] === opt ? 'font-medium' : ''}`}>
                            {opt}
                          </span>
                        </div>
                        {answers[idx] === opt && (
                          <div className="ml-auto">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                {answeredCount === questions.length 
                  ? "Toutes les questions ont été répondues ✓" 
                  : `${questions.length - answeredCount} question(s) restante(s)`
                }
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitted}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                submitted 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : answeredCount === questions.length
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {submitted 
                ? 'Soumission en cours...' 
                : answeredCount === questions.length 
                  ? 'Soumettre le test' 
                  : 'Soumettre (incomplet)'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
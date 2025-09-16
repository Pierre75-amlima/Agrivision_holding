// backend/controllers/testResultController.js
import mongoose from "mongoose";
import Test from "../models/test.js";
import TestResult from "../models/testResult.js";
import NotificationService from "../services/notificationService.js";

export const getTestByOffre = async (req, res) => {
  try {
    const { offreId } = req.params;
    const userId = req.userId;
    console.log("getTestByOffre appelé avec offreId:", offreId, "userId:", userId);
    console.log("Type de offreId :", typeof offreId);

    if (!offreId) return res.status(400).json({ message: "offreId manquant" });

    // 1) recherche par string
    let test = await Test.findOne({ offreId: offreId }).lean();
    console.log("résultat recherche string:", !!test, test ? test._id : null);

    // 2) recherche en ObjectId
    if (!test && mongoose.Types.ObjectId.isValid(offreId)) {
      const objId = new mongoose.Types.ObjectId(offreId);
      test = await Test.findOne({ offreId: objId }).lean();
      console.log("résultat recherche ObjectId:", !!test, test ? test._id : null);
    } 

    // 3) recherche par _id du test (fallback)
    if (!test && mongoose.Types.ObjectId.isValid(offreId)) {
      const byId = await Test.findById(offreId).lean();
      console.log("résultat recherche par test._id:", !!byId, byId ? byId._id : null);
      if (byId) test = byId;
    }

    if (!test) {
      console.log("Aucun test trouvé pour offreId:", offreId);
      return res.status(404).json({ message: "Aucun test associé à cette offre" });
    }

    // (le reste comme avant)
    if (userId) {
      const existing = await TestResult.findOne({ candidat: userId, test: test._id }).lean();
      if (existing) {
        if (["reussi", "echoue", "temps_depasse"].includes(existing.status)) {
          return res.status(200).json({
            alreadyPassed: true,
            message: "Vous avez déjà passé ce test.",
            result: { score: existing.score, status: existing.status, finishedAt: existing.finishedAt },
          });
        }
        return res.status(200).json({ alreadyPassed: false, inProgress: true, partialResultId: existing._id, test });
      }

      const started = await TestResult.create({
        candidat: userId,
        test: test._id,
        reponses: [],
        score: 0,
        status: "en_cours",
        startedAt: Date.now(),
      });

      return res.status(200).json({ started, test });
    }

    return res.status(200).json(test);
  } catch (err) {
    console.error("Erreur getTestByOffre :", err);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération du test", error: err.message });
  }
};

export const submitTest = async (req, res) => {
  try {
    const { candidatId, testId } = req.params;
    const candidate = candidatId || req.userId;
    const { reponses = [], startTime } = req.body;

    if (!candidate) return res.status(401).json({ message: "Utilisateur non identifié" });
    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) return res.status(400).json({ message: "testId invalide" });

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test non trouvé" });

    // Vérification si le test a déjà été soumis
    const existingFinal = await TestResult.findOne({
      candidat: candidate,
      test: testId,
      status: { $in: ["reussi", "echoue", "temps_depasse"] },
    });
    if (existingFinal) return res.status(409).json({ message: "Vous avez déjà soumis ce test." });

    // Création ou récupération du TestResult
    let testResult = await TestResult.findOne({ candidat: candidate, test: testId });
    if (!testResult) {
      testResult = await TestResult.create({
        candidat: candidate,
        test: testId,
        reponses,
        score: 0,
        status: "en_cours",
        startedAt: startTime || Date.now(),
      });
    }
 
    // Vérification temps imparti
    if (startTime && test.duree) {
      const elapsedSec = (Date.now() - Number(startTime)) / 1000;
      const allowedSec = Number(test.duree) * 60;
      if (elapsedSec > allowedSec) {
        testResult.reponses = reponses;
        testResult.score = 0;
        testResult.status = "temps_depasse";
        testResult.finishedAt = Date.now();
        await testResult.save();

        // 🔔 Populate pour notifications
        await testResult.populate([
          { path: 'candidat', select: 'nom prenoms email' },
          { path: 'test', select: 'titre description' }
        ]);

        // DÉCLENCHER NOTIFICATION test terminé (temps dépassé)
        try {
          await NotificationService.creerNotificationTestTermine(testResult);
          console.log('Notification test terminé (temps dépassé) envoyée');
        } catch (error) {
          console.error('Erreur notification test terminé:', error);
        }

        return res.json({ status: "temps_depasse", score: 0, message: "Temps imparti dépassé." });
      }
    }

    // Calcul du nombre de bonnes réponses
    const questions = test.questions || [];
    let nbCorrect = 0;
    questions.forEach((q, idx) => {
      const expected = (q.bonneReponse ?? "").toString().trim().toLowerCase();
      const given = (reponses?.[idx] ?? "").toString().trim().toLowerCase();
      if (expected && given && expected === given) nbCorrect += 1;
    });

    // Calcul de la note sur 20
    const nbQuestions = questions.length || 1; // éviter division par 0
    const note = (nbCorrect / nbQuestions) * 20;

    // Détermination du statut
    const status = note >= (test.scoreMinimum || 0) ? "reussi" : "echoue";

    // Sauvegarde
    testResult.reponses = reponses;
    testResult.score = note; // on stocke maintenant la note sur 20
    testResult.status = status;
    testResult.finishedAt = Date.now();
    await testResult.save();

    // 🔔 Populate pour notifications
    await testResult.populate([
      { path: 'candidat', select: 'nom prenoms email' },
      { path: 'test', select: 'titre description' }
    ]);

    // DÉCLENCHER NOTIFICATION test terminé
    try {
      await NotificationService.creerNotificationTestTermine(testResult);
      console.log('Notification test terminé envoyée');
    } catch (error) {
      console.error('Erreur notification test terminé:', error);
      // Ne pas faire échouer la soumission si la notification échoue
    }

    return res.json({
      status,
      score: note,
      message: status === "reussi"
        ? "Félicitations, vous avez réussi le test !"
        : "Désolé, vous avez échoué.",
        candidatureId: testResult._id
    });

  } catch (err) {
    console.error("Erreur API :", err);
    return res.status(500).json({ message: "Erreur serveur lors de la soumission du test", error: err.message });
  }
};

// 🔹 Récupérer les résultats d'un candidat
export const getTestResultsByCandidat = async (req, res) => {
  try {
    const { id } = req.params; // <- correspond à :id dans la route

    if (!id) return res.status(400).json({ message: "candidatId manquant" });

    const results = await TestResult.find({ candidat: id })
      .populate("test")
      .lean();

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Aucun résultat trouvé pour ce candidat" });
    }

    res.status(200).json(results);
  } catch (err) {
    console.error("Erreur getTestResultsByCandidat :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * 📋 Assigner un test à un candidat avec notification
 */
export const assignTestToCandidate = async (req, res) => {
  try {
    const { testId, candidatId } = req.body;

    if (!testId || !candidatId) {
      return res.status(400).json({ message: "testId et candidatId requis" });
    }

    const test = await Test.findById(testId);
    const candidat = await mongoose.model('User').findById(candidatId);

    if (!test) {
      return res.status(404).json({ message: "Test introuvable" });
    }

    if (!candidat) {
      return res.status(404).json({ message: "Candidat introuvable" });
    }

    // Vérifier si le test n'est pas déjà assigné/passé
    const existingResult = await TestResult.findOne({ 
      candidat: candidatId, 
      test: testId 
    });

    if (existingResult) {
      return res.status(409).json({ 
        message: "Ce test a déjà été assigné à ce candidat" 
      });
    }

    // Créer une entrée TestResult en attente
    const testResult = await TestResult.create({
      candidat: candidatId,
      test: testId,
      reponses: [],
      score: 0,
      status: "assigne", // nouveau statut pour tests assignés
      assignedAt: Date.now()
    });

    // 🔔 DÉCLENCHER NOTIFICATION nouveau test assigné
    try {
      await NotificationService.creerNotificationNouveauTestAssigne(test, candidat);
      console.log('Notification nouveau test assigné envoyée');
    } catch (error) {
      console.error('Erreur notification test assigné:', error);
    }

    res.status(200).json({
      message: "Test assigné avec succès",
      test: {
        id: test._id,
        titre: test.titre,
        duree: test.duree
      },
      candidat: {
        id: candidat._id,
        nom: candidat.nom,
        prenoms: candidat.prenoms
      },
      assignement: testResult._id
    });

  } catch (error) {
    console.error('Erreur assignation test:', error);
    res.status(500).json({
      message: "Erreur lors de l'assignation du test",
      error: error.message
    });
  }
};

/**
 * 🔔 Envoyer un rappel de test
 */
export const sendTestReminder = async (req, res) => {
  try {
    const { testResultId } = req.params;
    
    const testResult = await TestResult.findById(testResultId)
      .populate('candidat', 'nom prenoms email')
      .populate('test', 'titre duree');

    if (!testResult) {
      return res.status(404).json({ message: "Test result introuvable" });
    }

    if (testResult.status !== "assigne" && testResult.status !== "en_cours") {
      return res.status(400).json({ 
        message: "Le test a déjà été terminé" 
      });
    }

    // Calculer le temps restant
    const now = Date.now();
    const assignedTime = testResult.assignedAt || testResult.startedAt;
    const dureeLimite = testResult.test.duree * 60 * 1000; // en millisecondes
    const tempsEcoule = now - assignedTime;
    const tempsRestant = Math.max(0, dureeLimite - tempsEcoule);
    
    const heuresRestantes = Math.floor(tempsRestant / (1000 * 60 * 60));
    const minutesRestantes = Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60));
    
    let tempsRestantText = "";
    if (heuresRestantes > 0) {
      tempsRestantText = `${heuresRestantes}h ${minutesRestantes}min`;
    } else {
      tempsRestantText = `${minutesRestantes} minutes`;
    }

    // 🔔 DÉCLENCHER NOTIFICATION rappel de test
    try {
      await NotificationService.creerNotificationRappelTest(
        testResult.test, 
        testResult.candidat, 
        tempsRestantText
      );
      console.log('Notification rappel test envoyée');
    } catch (error) {
      console.error('Erreur notification rappel test:', error);
    }

    res.status(200).json({
      message: "Rappel de test envoyé",
      candidat: `${testResult.candidat.prenoms} ${testResult.candidat.nom}`,
      test: testResult.test.titre,
      tempsRestant: tempsRestantText
    });

  } catch (error) {
    console.error('Erreur rappel test:', error);
    res.status(500).json({
      message: "Erreur lors de l'envoi du rappel",
      error: error.message
    });
  }
};
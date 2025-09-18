// routes/candidateRoutes.js
import express from "express";
import {
  createOrUpdateCandidate,
  getAllCandidates,
  getCandidateById,
  getCandidatesByOffer,
  getCandidatesByUser, // 🆕
  deleteCandidate,
  deleteManyCandidates,
  getMyCandidateByOffer,
  acceptCandidate,
  rejectCandidate,
} from "../controllers/candidateController.js";

import { upload } from "../config/cloudinary.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * ➕ Création ou mise à jour d'une candidature
 * - POST : création
 * - PUT  : mise à jour par ID
 */
router.post("/", verifyToken, upload.single("cv"), createOrUpdateCandidate);
router.put("/:id", verifyToken, upload.single("cv"), createOrUpdateCandidate);

/**
 * 📌 Récupération de toutes les candidatures (admin)
 */
router.get("/", verifyToken, getAllCandidates);

/**
 * 🔎 Récupérer la candidature du candidat connecté pour une offre donnée
 * ⚠️ Doit être avant '/:id'
 */
router.get("/me/:offreId", verifyToken, getMyCandidateByOffer);

/**
 * 🆕 Récupérer toutes les candidatures d'un utilisateur spécifique
 * ⚠️ Doit aussi être avant '/:id'
 */
router.get("/user/:userId", verifyToken, getCandidatesByUser);

/**
 * 🎯 Lecture des candidats liés à une offre
 */
router.get("/offre/:id", verifyToken, getCandidatesByOffer);

/**
 * 🔎 Lecture d'un candidat par ID
 */
router.get("/:id", verifyToken, getCandidateById);

/**
 * ✅ Accepter / Rejeter un candidat
 */
router.put("/:id/accept", verifyToken, acceptCandidate);
router.put("/:id/reject", verifyToken, rejectCandidate);

/**
 * ❌ Suppression individuelle
 */
router.delete("/:id", verifyToken, deleteCandidate);

/**
 * ❌❌ Suppression multiple
 */
router.delete("/", verifyToken, deleteManyCandidates);

export default router;

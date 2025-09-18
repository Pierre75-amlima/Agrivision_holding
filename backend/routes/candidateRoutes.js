import express from 'express';
import {
  createOrUpdateCandidate,
  getAllCandidates,
  getCandidateById,
  getCandidatesByOffer,
  getCandidatesByUser, // 🆕 Nouvelle import
  deleteCandidate,
  deleteManyCandidates,
  getMyCandidateByOffer,
  acceptCandidate,
  rejectCandidate
} from '../controllers/candidateController.js';
import { upload, uploadMemory } from '../config/cloudinary.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();



router.post('/test-multer', verifyToken, upload.single('cv'), (req, res) => {
  console.log('--- TEST MULTER ---');
  console.log('Headers reçus Content-Type:', req.headers['content-type']);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Fichier reçu:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : null);

  res.json({ 
    message: 'Test Multer terminé', 
    hasFile: !!req.file,
    file: req.file ? req.file.originalname : null
  });
});


// Ajoutez cette route de test
router.post('/test-memory', verifyToken, uploadMemory.single('cv'), (req, res) => {
  console.log('Test memory storage atteint');
  console.log('Buffer size:', req.file ? req.file.buffer.length : 0);
  res.json({ 
    message: 'Test memory OK', 
    fileSize: req.file ? req.file.buffer.length : 0 
  });
});

// ➕ Création ou mise à jour
router.post('/', verifyToken, upload.single('cv'), createOrUpdateCandidate);
router.put('/:id', verifyToken, upload.single('cv'), createOrUpdateCandidate);

// 📌 Lecture tous les candidats (admin)
router.get('/', verifyToken, getAllCandidates);

// 🔎 Récupérer la candidature du candidat connecté pour une offre donnée
// ⚠️ Cette route doit être avant '/:id'
router.get("/me/:offreId", verifyToken, getMyCandidateByOffer);

// 🆕 Récupérer toutes les candidatures d'un utilisateur spécifique
// ⚠️ Cette route doit aussi être avant '/:id' pour éviter les conflits
router.get('/user/:userId', verifyToken, getCandidatesByUser);

// 🎯 Lecture des candidats liés à une offre
router.get('/offre/:id', verifyToken, getCandidatesByOffer);

// 🔎 Lecture d'un candidat par ID
router.get('/:id', verifyToken, getCandidateById);

// ✅ Accepter / Rejeter un candidat
router.put("/:id/accept", verifyToken, acceptCandidate);
router.put("/:id/reject", verifyToken, rejectCandidate);

// ❌ Suppression individuelle
router.delete('/:id', verifyToken, deleteCandidate);

// ❌❌ Suppression multiple
router.delete('/', verifyToken, deleteManyCandidates);

export default router;

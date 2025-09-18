import mongoose from "mongoose";
import Candidate from "../models/candidate.js";
import Offre from "../models/offre.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import NotificationService from "../services/notificationService.js";

/**
 * ➕ Créer ou mettre à jour une candidature (user + offre) avec notifications
 */
export const createOrUpdateCandidate = async (req, res) => {
  console.log('=== DEBUT createOrUpdateCandidate ===');
  
  try {
    console.log('User ID from token:', req.userId);
    console.log('File present:', !!req.file);
    
    const body = { ...req.body };

    // Parser champs JSON encodés en string (FormData)
    console.log('=== PARSING JSON FIELDS ===');
    if (body.competences && typeof body.competences === 'string') {
      console.log('Parsing competences:', body.competences);
      try { 
        body.competences = JSON.parse(body.competences); 
        console.log('Competences parsed successfully');
      } catch (e) { 
        console.error('Competences parse failed:', e.message);
        return res.status(400).json({ message: "Format invalide pour les compétences" });
      }
    }
    
    if (body.experiences && typeof body.experiences === 'string') {
      console.log('Parsing experiences:', body.experiences);
      try { 
        body.experiences = JSON.parse(body.experiences); 
        console.log('Experiences parsed successfully');
      } catch (e) { 
        console.error('Experiences parse failed:', e.message);
        return res.status(400).json({ message: "Format invalide pour les expériences" });
      }
    }

    // NOUVEAU : TRAITEMENT FICHIER CV avec upload direct vers Cloudinary
    console.log('=== TRAITEMENT FICHIER CV ===');
    if (req.file) {
      console.log('Fichier reçu - Nom:', req.file.originalname);
      console.log('Taille:', req.file.buffer.length, 'bytes');
      console.log('Type MIME:', req.file.mimetype);
      
      try {
        console.log('Début upload vers Cloudinary...');
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer, 
          req.file.originalname, 
          req.file.mimetype
        );
        
        body.cvUrl = cloudinaryResult.secure_url;
        console.log('✅ CV uploadé avec succès:', body.cvUrl);
        
      } catch (error) {
        console.error('❌ Erreur upload Cloudinary:', error.message);
        return res.status(400).json({ 
          message: "Erreur lors de l'upload du CV", 
          error: error.message 
        });
      }
    } else {
      console.log('Aucun fichier reçu');
    }

    console.log('=== VERIFICATION USER ===');
    // Attacher l'utilisateur
    if (!body.user) {
      if (req.userId) {
        body.user = req.userId;
        console.log('Using req.userId:', req.userId);
      } else if (req.user?.id) {
        body.user = req.user.id;
        console.log('Using req.user.id:', req.user.id);
      } else {
        console.error('No user ID found');
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
    }

    console.log('Final user ID:', body.user);
    console.log('Offre ID:', body.offre);

    // Validation des ObjectId
    let userId, offreId;
    try {
      userId = new mongoose.Types.ObjectId(body.user);
      offreId = new mongoose.Types.ObjectId(body.offre);
      console.log('ObjectIds créés avec succès');
    } catch (error) {
      console.error('Erreur création ObjectIds:', error.message);
      return res.status(400).json({ message: "IDs invalides" });
    }

    console.log('=== RECHERCHE CANDIDATURE EXISTANTE ===');
    // Vérifier si candidature existante
    let candidate = await Candidate.findOne({ user: userId, offre: offreId });
    let isNewCandidate = false;

    if (candidate) {
      console.log('Candidature existante trouvée, mise à jour...');
      Object.assign(candidate, body);
      candidate.dateSoumission = Date.now();
      await candidate.save();
      console.log('Candidature mise à jour avec succès');
    } else {
      console.log('Nouvelle candidature, création...');
      candidate = new Candidate({ ...body, user: userId, offre: offreId });
      await candidate.save();
      console.log('Nouvelle candidature créée avec ID:', candidate._id);
      isNewCandidate = true;
    }

    console.log('=== POPULATION DES DONNEES ===');
    // Populate les données pour les notifications
    await candidate.populate([
      { path: 'user', select: 'nom prenoms email' },
      { path: 'offre', select: 'titre description' }
    ]);
    console.log('Population terminée');

    console.log('=== NOTIFICATION ===');
    // DÉCLENCHER NOTIFICATION pour nouvelle candidature
    if (isNewCandidate) {
      try {
        console.log('Envoi notification nouvelle candidature...');
        await NotificationService.creerNotificationNouvelleCandidature(candidate);
        console.log('Notification envoyée avec succès');
      } catch (error) {
        console.error('Erreur notification:', error.message);
        // Ne pas faire échouer la création de candidature
      }
    } else {
      console.log('Candidature mise à jour, pas de notification');
    }

    console.log('=== SUCCESS RESPONSE ===');
    return res.status(isNewCandidate ? 201 : 200).json({
      message: isNewCandidate ? "Candidature créée avec succès" : "Candidature mise à jour avec succès",
      candidate: candidate,
      _id: candidate._id
    });

  } catch (error) {
    console.error('=== ERREUR createOrUpdateCandidate ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      message: "Erreur lors de l'enregistrement", 
      error: error.message || error.toString()
    });
  }
};

/**
 * ✅ Accepter une candidature avec notification
 */
export const acceptCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id)
      .populate('user', 'nom prenoms email')
      .populate('offre', 'titre description');

    if (!candidate) {
      return res.status(404).json({ message: "Candidature non trouvée" });
    }

    candidate.statut = "Accepté";
    await candidate.save();

    // DÉCLENCHER NOTIFICATION candidature acceptée
    try {
      await NotificationService.creerNotificationCandidatureAcceptee(candidate);
      console.log('Notification candidature acceptée envoyée');
    } catch (error) {
      console.error('Erreur notification candidature acceptée:', error);
    }

    res.status(200).json({ 
      message: "Candidature acceptée", 
      candidate 
    });
  } catch (error) {
    console.error('Erreur acceptation candidature:', error);
    res.status(500).json({ 
      message: "Erreur lors de l'acceptation", 
      error: error.message 
    });
  }
};

/**
 * ❌ Rejeter une candidature avec notification
 */
export const rejectCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;
    
    const candidate = await Candidate.findById(id)
      .populate('user', 'nom prenoms email')
      .populate('offre', 'titre description');

    if (!candidate) {
      return res.status(404).json({ message: "Candidature non trouvée" });
    }

    candidate.statut = "Rejeté";
    if (motif) candidate.motifRejet = motif;
    await candidate.save();

    // DÉCLENCHER NOTIFICATION candidature rejetée
    try {
      await NotificationService.creerNotificationCandidatureRejetee(candidate, motif);
      console.log('Notification candidature rejetée envoyée');
    } catch (error) {
      console.error('Erreur notification candidature rejetée:', error);
    }

    res.status(200).json({ 
      message: "Candidature rejetée", 
      candidate 
    });
  } catch (error) {
    console.error('Erreur rejet candidature:', error);
    res.status(500).json({ 
      message: "Erreur lors du rejet", 
      error: error.message 
    });
  }
};

/**
 * Fonction utilitaire pour normaliser les chaînes de recherche
 */
const normalizeSearchTerm = (term) => {
  if (!term) return '';
  return term
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Fonction pour créer des variations de mots (singulier/pluriel, terminaisons communes)
 */
const createWordVariations = (word) => {
  const variations = [word];
  const normalized = normalizeSearchTerm(word);
  
  if (normalized !== word) variations.push(normalized);
  
  const commonEndings = {
    'ment': 'eur',
    'eur': 'ment',
    'ion': 'er',
    'er': 'ion',
    's': '',
    'x': '',
  };
  
  Object.keys(commonEndings).forEach(ending => {
    if (normalized.endsWith(ending)) {
      const root = normalized.slice(0, -ending.length);
      const newEnding = commonEndings[ending];
      if (newEnding) {
        variations.push(root + newEnding);
      } else {
        variations.push(root);
      }
    }
  });
  
  return [...new Set(variations)];
};

/**
 * Récupérer tous les candidats avec filtres dynamiques + populate
 */
export const getAllCandidates = async (req, res) => {
  try {
    const { search, poste, statut, competences, dateFrom, dateTo, testValide, minExperienceMonths } = req.query;
    
    let pipeline = [
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $lookup: { from: "offres", localField: "offre", foreignField: "_id", as: "offre" } },
      { $unwind: "$user" },
      { $unwind: "$offre" }
    ];

    let matchConditions = {};

    if (search && search.trim()) {
      const normalizedSearch = normalizeSearchTerm(search);
      matchConditions.$or = [
        { "user.nom": { $regex: normalizedSearch, $options: "i" } },
        { "user.prenoms": { $regex: normalizedSearch, $options: "i" } },
        { $expr: { $regexMatch: { input: { $toLower: { $concat: [{ $ifNull: ["$user.nom",""] }, " ", { $ifNull: ["$user.prenoms",""] }] } }, regex: normalizedSearch, options: "i" } } }
      ];
    }

    if (poste && poste.trim()) {
      const normalizedPoste = normalizeSearchTerm(poste);
      const mots = normalizedPoste.split(/\s+/).filter(Boolean);
      const allVariations = mots.flatMap(mot => createWordVariations(mot));
      
      matchConditions.$or = [
        { "offre.titre": { $regex: normalizedPoste, $options: "i" } },
        ...allVariations.map(variation => ({
          "offre.titre": { $regex: variation, $options: "i" }
        })),
        { "offre.description": { $regex: normalizedPoste, $options: "i" } },
        ...allVariations.map(variation => ({
          "offre.description": { $regex: variation, $options: "i" }
        }))
      ];
    }

    if (statut) matchConditions.statut = statut;

    if (competences && competences.trim()) {
      const compArray = competences.split(",").map(c => c.trim()).filter(Boolean);
      const allCompVariations = compArray.flatMap(comp => createWordVariations(comp));
      
      matchConditions.$or = [
        ...(matchConditions.$or || []),
        ...allCompVariations.map(variation => ({
          competences: { $regex: variation, $options: "i" }
        }))
      ];
    }

    if (dateFrom || dateTo) {
      matchConditions.createdAt = {};
      if (dateFrom) matchConditions.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchConditions.createdAt.$lte = new Date(dateTo);
    }

    if (testValide) {
      if (testValide === "oui") {
        matchConditions["testResult.score"] = { $exists: true, $ne: null };
      } else {
        matchConditions.$or = [
          ...(matchConditions.$or || []),
          { "testResult.score": { $exists: false } },
          { "testResult.score": null }
        ];
      }
    }

    if (minExperienceMonths) {
      matchConditions.experiences = { $elemMatch: { duree: { $gte: Number(minExperienceMonths) } } };
    }

    if (Object.keys(matchConditions).length > 0) pipeline.push({ $match: matchConditions });

    if (poste && poste.trim()) {
      pipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              { $cond: [{ $regexMatch: { input: "$offre.titre", regex: normalizeSearchTerm(poste), options: "i" } }, 10, 0] },
              { $cond: [{ $regexMatch: { input: "$offre.titre", regex: poste.split(' ')[0] || '', options: "i" } }, 5, 0] },
              { $cond: [{ $regexMatch: { input: "$offre.description", regex: normalizeSearchTerm(poste), options: "i" } }, 2, 0] }
            ]
          }
        }
      });
      pipeline.push({ $sort: { searchScore: -1, dateSoumission: -1 } });
    } else {
      pipeline.push({ $sort: { dateSoumission: -1 } });
    }

    const candidates = await Candidate.aggregate(pipeline);
    res.status(200).json(candidates);

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * Version alternative simple mais plus flexible
 */
export const getAllCandidatesSimple = async (req, res) => {
  try {
    const { search, poste, statut, competences } = req.query;
    const candidates = await Candidate.find({})
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 });

    let filtered = candidates;

    if (search && search.trim()) {
      const s = normalizeSearchTerm(search);
      filtered = filtered.filter(c => `${c.user?.nom || ''} ${c.user?.prenoms || ''}`.toLowerCase().includes(s));
    }

    if (poste && poste.trim()) {
      const normalizedPoste = normalizeSearchTerm(poste);
      const mots = normalizedPoste.split(/\s+/).filter(Boolean);
      
      filtered = filtered.filter(c => {
        const titre = (c.offre?.titre || '').toLowerCase();
        const description = (c.offre?.description || '').toLowerCase();
        
        return mots.some(mot => {
          const variations = createWordVariations(mot);
          return variations.some(variation => 
            titre.includes(variation) || description.includes(variation)
          );
        });
      });
    }

    if (statut) filtered = filtered.filter(c => c.statut === statut);

    if (competences && competences.trim()) {
      const compArray = competences.split(",").map(c => c.trim()).filter(Boolean);
      filtered = filtered.filter(c => {
        return compArray.some(comp => {
          const variations = createWordVariations(comp);
          return c.competences?.some(cc => 
            variations.some(variation => cc.toLowerCase().includes(variation))
          );
        });
      });
    }

    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * Récupérer une candidature par ID
 */
export const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description");
    if (!candidate) return res.status(404).json({ message: "Candidat non trouvé" });
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error });
  }
};

/**
 * Récupérer la candidature du candidat connecté pour une offre donnée
 */
export const getMyCandidateByOffer = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const offreId = new mongoose.Types.ObjectId(req.params.offreId);
    const candidate = await Candidate.findOne({ user: userId, offre: offreId })
      .populate("user", "nom prenoms email telephone adresse")
      .populate("offre", "titre description");
    if (!candidate) return res.status(404).json({ message: "Candidature non trouvée pour cette offre" });
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message || error });
  }
};

/**
 * Récupérer toutes les candidatures liées à une offre
 */
export const getCandidatesByOffer = async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const candidates = await Candidate.find({ offre: id })
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 });
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error });
  }
};

/**
 * Supprimer un candidat
 */
export const deleteCandidate = async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Candidat supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};

/**
 * Supprimer plusieurs candidats
 */
export const deleteManyCandidates = async (req, res) => {
  try {
    const { ids } = req.body;
    await Candidate.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: "Candidats supprimés" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression multiple", error });
  }
};

/**
 * Récupérer toutes les candidatures d'un utilisateur spécifique
 */
export const getCandidatesByUser = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    
    const candidates = await Candidate.find({ user: userId })
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 });
    
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la récupération des candidatures de l'utilisateur", 
      error: error.message || error 
    });
  }
};
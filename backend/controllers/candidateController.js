import mongoose from "mongoose";
import Candidate from "../models/candidate.js";
import Offre from "../models/offre.js";
import { getCloudinaryUrl } from "../config/cloudinary.js";
import NotificationService from "../services/notificationService.js";

/**
 * ➕ Créer ou mettre à jour une candidature (user + offre) avec notifications
 */
export const createOrUpdateCandidate = async (req, res) => {
  console.log('=== DEBUT createOrUpdateCandidate ===');
  
  try {
    console.log('User ID from token:', req.userId);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Body content:', JSON.stringify(req.body, null, 2));
    console.log('File present:', !!req.file);
    
    if (req.file) {
      console.log('File details:', JSON.stringify({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname,
        encoding: req.file.encoding
      }, null, 2));
    }

    const body = { ...req.body };
    console.log('Body after spread:', JSON.stringify(body, null, 2));

    // Parser champs JSON encodés en string (FormData)
    console.log('=== PARSING JSON FIELDS ===');
    
    if (body.competences && typeof body.competences === 'string') {
      console.log('Parsing competences string:', body.competences);
      try { 
        body.competences = JSON.parse(body.competences);
        console.log('Competences parsed successfully:', JSON.stringify(body.competences, null, 2));
      } catch (e) { 
        console.error('Competences parse failed:', e.message);
        console.error('Raw competences value:', body.competences);
        return res.status(400).json({ message: "Format invalide pour les compétences", error: e.message });
      }
    }
    
    if (body.experiences && typeof body.experiences === 'string') {
      console.log('Parsing experiences string:', body.experiences);
      try { 
        body.experiences = JSON.parse(body.experiences);
        console.log('Experiences parsed successfully:', JSON.stringify(body.experiences, null, 2));
      } catch (e) { 
        console.error('Experiences parse failed:', e.message);
        console.error('Raw experiences value:', body.experiences);
        return res.status(400).json({ message: "Format invalide pour les expériences", error: e.message });
      }
    }

    console.log('=== APRES PARSING JSON ===');
    console.log('Competences type:', typeof body.competences, 'Value:', JSON.stringify(body.competences, null, 2));
    console.log('Experiences type:', typeof body.experiences, 'Value:', JSON.stringify(body.experiences, null, 2));

    // CORRECTION : CV uploadé
    console.log('=== TRAITEMENT FICHIER CV ===');
    if (req.file) {
      console.log('Processing uploaded file...');
      console.log('File object keys:', Object.keys(req.file));
      console.log('File secure_url:', req.file.secure_url);
      console.log('File public_id:', req.file.public_id);
      console.log('File mimetype:', req.file.mimetype);

      // UTILISER DIRECTEMENT L'URL SÉCURISÉE DE CLOUDINARY
      if (req.file.secure_url) {
        body.cvUrl = req.file.secure_url;
        console.log('Using secure_url:', body.cvUrl);
      } else if (req.file.public_id) {
        console.log('secure_url not available, generating from public_id');
        const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
        body.cvUrl = getCloudinaryUrl(req.file.public_id, resourceType);
        console.log('Generated CV URL:', body.cvUrl);
      } else {
        console.error('Neither secure_url nor public_id available in file object');
        return res.status(400).json({ message: "Erreur lors de l'upload du CV - URL manquante" });
      }
    } else {
      console.log('No file uploaded');
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
        console.error('No user ID found in request');
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
    }

    console.log('Final user ID:', body.user);
    console.log('Offre ID from body:', body.offre);

    // Validation des ObjectId
    let userId, offreId;
    try {
      userId = new mongoose.Types.ObjectId(body.user);
      offreId = new mongoose.Types.ObjectId(body.offre);
      console.log('ObjectIds created successfully');
      console.log('userId ObjectId:', userId);
      console.log('offreId ObjectId:', offreId);
    } catch (error) {
      console.error('Error creating ObjectIds:', error.message);
      return res.status(400).json({ message: "IDs invalides", error: error.message });
    }

    console.log('=== RECHERCHE CANDIDATURE EXISTANTE ===');
    // Vérifier si candidature existante
    let candidate = await Candidate.findOne({ user: userId, offre: offreId });
    let isNewCandidate = false;

    if (candidate) {
      console.log('Candidature existante trouvée, mise à jour...');
      console.log('Candidate ID:', candidate._id);
      
      Object.assign(candidate, body);
      candidate.dateSoumission = Date.now();
      
      console.log('Sauvegarde de la candidature mise à jour...');
      await candidate.save();
      console.log('Candidature mise à jour sauvegardée');
    } else {
      console.log('Nouvelle candidature, création...');
      console.log('Data to create:', JSON.stringify({ ...body, user: userId, offre: offreId }, null, 2));
      
      candidate = new Candidate({ ...body, user: userId, offre: offreId });
      
      console.log('Sauvegarde de la nouvelle candidature...');
      await candidate.save();
      console.log('Nouvelle candidature sauvegardée avec ID:', candidate._id);
      isNewCandidate = true;
    }

    console.log('=== POPULATION DES DONNEES ===');
    // Populate les données pour les notifications
    await candidate.populate([
      { path: 'user', select: 'nom prenoms email' },
      { path: 'offre', select: 'titre description' }
    ]);
    console.log('Population terminée');
    console.log('User populated:', JSON.stringify(candidate.user, null, 2));
    console.log('Offre populated:', JSON.stringify(candidate.offre, null, 2));

    console.log('=== NOTIFICATION ===');
    // 🔔 DÉCLENCHER NOTIFICATION pour nouvelle candidature
    if (isNewCandidate) {
      try {
        console.log('Envoi notification nouvelle candidature...');
        await NotificationService.creerNotificationNouvelleCandidature(candidate);
        console.log('Notification nouvelle candidature envoyée avec succès');
      } catch (error) {
        console.error('Erreur notification nouvelle candidature:', error.message);
        console.error('Stack trace notification:', error.stack);
        // Ne pas faire échouer la création de candidature si la notification échoue
      }
    } else {
      console.log('Candidature mise à jour, pas de notification');
    }

    console.log('=== SUCCESS RESPONSE ===');
    console.log('Returning candidate with ID:', candidate._id);
    console.log('Status code:', isNewCandidate ? 201 : 200);
    
    return res.status(isNewCandidate ? 201 : 200).json({
      message: isNewCandidate ? "Candidature créée avec succès" : "Candidature mise à jour avec succès",
      candidate: candidate,
      _id: candidate._id // Ajouté pour compatibility avec le frontend
    });

  } catch (error) {
    console.error('=== ERREUR DANS createOrUpdateCandidate ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('================================================');
    
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
    console.log('=== ACCEPTATION CANDIDATURE ===');
    const { id } = req.params;
    console.log('Candidate ID to accept:', id);
    
    const candidate = await Candidate.findById(id)
      .populate('user', 'nom prenoms email')
      .populate('offre', 'titre description');

    if (!candidate) {
      console.log('Candidature non trouvée pour ID:', id);
      return res.status(404).json({ message: "Candidature non trouvée" });
    }

    console.log('Candidature trouvée, statut actuel:', candidate.statut);
    candidate.statut = "Accepté";
    await candidate.save();
    console.log('Statut mis à jour vers "Accepté"');

    // 🔔 DÉCLENCHER NOTIFICATION candidature acceptée
    try {
      console.log('Envoi notification candidature acceptée...');
      await NotificationService.creerNotificationCandidatureAcceptee(candidate);
      console.log('Notification candidature acceptée envoyée');
    } catch (error) {
      console.error('Erreur notification candidature acceptée:', error.message);
    }

    res.status(200).json({ 
      message: "Candidature acceptée", 
      candidate 
    });
  } catch (error) {
    console.error('Erreur acceptation candidature:', error.message);
    console.error('Stack trace:', error.stack);
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
    console.log('=== REJET CANDIDATURE ===');
    const { id } = req.params;
    const { motif } = req.body;
    console.log('Candidate ID to reject:', id);
    console.log('Motif de rejet:', motif);
    
    const candidate = await Candidate.findById(id)
      .populate('user', 'nom prenoms email')
      .populate('offre', 'titre description');

    if (!candidate) {
      console.log('Candidature non trouvée pour ID:', id);
      return res.status(404).json({ message: "Candidature non trouvée" });
    }

    console.log('Candidature trouvée, statut actuel:', candidate.statut);
    candidate.statut = "Rejeté";
    if (motif) candidate.motifRejet = motif;
    await candidate.save();
    console.log('Statut mis à jour vers "Rejeté"');

    // 🔔 DÉCLENCHER NOTIFICATION candidature rejetée
    try {
      console.log('Envoi notification candidature rejetée...');
      await NotificationService.creerNotificationCandidatureRejetee(candidate, motif);
      console.log('Notification candidature rejetée envoyée');
    } catch (error) {
      console.error('Erreur notification candidature rejetée:', error.message);
    }

    res.status(200).json({ 
      message: "Candidature rejetée", 
      candidate 
    });
  } catch (error) {
    console.error('Erreur rejet candidature:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: "Erreur lors du rejet", 
      error: error.message 
    });
  }
};

/**
 * 🔧 Fonction utilitaire pour normaliser les chaînes de recherche
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
 * 🔧 Fonction pour créer des variations de mots (singulier/pluriel, terminaisons communes)
 */
const createWordVariations = (word) => {
  const variations = [word];
  const normalized = normalizeSearchTerm(word);
  
  // Ajouter le mot normalisé s'il est différent
  if (normalized !== word) variations.push(normalized);
  
  // Gérer les terminaisons communes françaises
  const commonEndings = {
    'ment': 'eur', // management -> manageur
    'eur': 'ment', // manageur -> management
    'ion': 'er',   // gestion -> gérer
    'er': 'ion',   // gérer -> gestion
    's': '',       // pluriels
    'x': '',       // pluriels
  };
  
  Object.keys(commonEndings).forEach(ending => {
    if (normalized.endsWith(ending)) {
      const root = normalized.slice(0, -ending.length);
      const newEnding = commonEndings[ending];
      if (newEnding) {
        variations.push(root + newEnding);
      } else {
        variations.push(root); // Pour supprimer s, x
      }
    }
  });
  
  return [...new Set(variations)]; // Supprimer les doublons
};

/**
 * 📌 Récupérer tous les candidats avec filtres dynamiques + populate (VERSION TRÈS FLEXIBLE)
 */
export const getAllCandidates = async (req, res) => {
  try {
    console.log('=== GET ALL CANDIDATES ===');
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    
    const { search, poste, statut, competences, dateFrom, dateTo, testValide, minExperienceMonths } = req.query;
    
    let pipeline = [
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $lookup: { from: "offres", localField: "offre", foreignField: "_id", as: "offre" } },
      { $unwind: "$user" },
      { $unwind: "$offre" }
    ];

    let matchConditions = {};

    // 🔍 Recherche globale sur nom et prénoms
    if (search && search.trim()) {
      const normalizedSearch = normalizeSearchTerm(search);
      matchConditions.$or = [
        { "user.nom": { $regex: normalizedSearch, $options: "i" } },
        { "user.prenoms": { $regex: normalizedSearch, $options: "i" } },
        { $expr: { $regexMatch: { input: { $toLower: { $concat: [{ $ifNull: ["$user.nom",""] }, " ", { $ifNull: ["$user.prenoms",""] }] } }, regex: normalizedSearch, options: "i" } } }
      ];
    }

    // 🎯 Recherche par poste TRÈS FLEXIBLE
    if (poste && poste.trim()) {
      const normalizedPoste = normalizeSearchTerm(poste);
      const mots = normalizedPoste.split(/\s+/).filter(Boolean);
      
      // Créer toutes les variations possibles pour chaque mot
      const allVariations = mots.flatMap(mot => createWordVariations(mot));
      
      // Au lieu d'exiger TOUS les mots (AND), on cherche si AU MOINS UN mot correspond (OR)
      // Ou on peut faire un système de score : plus il y a de mots qui correspondent, mieux c'est
      matchConditions.$or = [
        // Recherche exacte d'abord (priorité haute)
        { "offre.titre": { $regex: normalizedPoste, $options: "i" } },
        // Puis recherche avec variations
        ...allVariations.map(variation => ({
          "offre.titre": { $regex: variation, $options: "i" }
        })),
        // Recherche dans la description aussi
        { "offre.description": { $regex: normalizedPoste, $options: "i" } },
        ...allVariations.map(variation => ({
          "offre.description": { $regex: variation, $options: "i" }
        }))
      ];
    }

    // 📌 Statut
    if (statut) {
      matchConditions.statut = statut;
    }

    // 🛠 Compétences TRÈS FLEXIBLES avec variations
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

    // 📆 Dates
    if (dateFrom || dateTo) {
      matchConditions.createdAt = {};
      if (dateFrom) matchConditions.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchConditions.createdAt.$lte = new Date(dateTo);
    }

    // ✅ Test validé
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

    // ⏳ Expérience minimale
    if (minExperienceMonths) {
      matchConditions.experiences = { $elemMatch: { duree: { $gte: Number(minExperienceMonths) } } };
    }

    if (Object.keys(matchConditions).length > 0) pipeline.push({ $match: matchConditions });

    // Ajouter un score de pertinence si recherche par poste
    if (poste && poste.trim()) {
      pipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              // Score pour titre exact
              { $cond: [{ $regexMatch: { input: "$offre.titre", regex: normalizeSearchTerm(poste), options: "i" } }, 10, 0] },
              // Score pour mots individuels dans titre
              { $cond: [{ $regexMatch: { input: "$offre.titre", regex: poste.split(' ')[0] || '', options: "i" } }, 5, 0] },
              // Score pour description
              { $cond: [{ $regexMatch: { input: "$offre.description", regex: normalizeSearchTerm(poste), options: "i" } }, 2, 0] }
            ]
          }
        }
      });
      pipeline.push({ $sort: { searchScore: -1, dateSoumission: -1 } });
    } else {
      pipeline.push({ $sort: { dateSoumission: -1 } });
    }

    console.log('Executing aggregation pipeline...');
    const candidates = await Candidate.aggregate(pipeline);
    console.log('Found candidates:', candidates.length);
    
    res.status(200).json(candidates);

  } catch (error) {
    console.error('Erreur getAllCandidates:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * 📌 Version alternative simple mais plus flexible
 */
export const getAllCandidatesSimple = async (req, res) => {
  try {
    console.log('=== GET ALL CANDIDATES SIMPLE ===');
    const { search, poste, statut, competences } = req.query;
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    
    const candidates = await Candidate.find({})
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 });

    console.log('Total candidates found:', candidates.length);
    let filtered = candidates;

    // Recherche nom/prénom
    if (search && search.trim()) {
      const s = normalizeSearchTerm(search);
      filtered = filtered.filter(c => `${c.user?.nom || ''} ${c.user?.prenoms || ''}`.toLowerCase().includes(s));
      console.log('After name search filter:', filtered.length);
    }

    // Recherche poste flexible
    if (poste && poste.trim()) {
      const normalizedPoste = normalizeSearchTerm(poste);
      const mots = normalizedPoste.split(/\s+/).filter(Boolean);
      
      filtered = filtered.filter(c => {
        const titre = (c.offre?.titre || '').toLowerCase();
        const description = (c.offre?.description || '').toLowerCase();
        
        // Recherche flexible : si au moins un mot correspond
        return mots.some(mot => {
          const variations = createWordVariations(mot);
          return variations.some(variation => 
            titre.includes(variation) || description.includes(variation)
          );
        });
      });
      console.log('After position search filter:', filtered.length);
    }

    // Statut
    if (statut) {
      filtered = filtered.filter(c => c.statut === statut);
      console.log('After status filter:', filtered.length);
    }

    // Compétences flexibles
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
      console.log('After competences filter:', filtered.length);
    }

    res.status(200).json(filtered);
  } catch (error) {
    console.error('Erreur getAllCandidatesSimple:', error.message);
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * 🔎 Récupérer une candidature par ID
 */
export const getCandidateById = async (req, res) => {
  try {
    console.log('=== GET CANDIDATE BY ID ===');
    console.log('Candidate ID:', req.params.id);
    
    const candidate = await Candidate.findById(req.params.id)
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description");
      
    if (!candidate) {
      console.log('Candidat non trouvé');
      return res.status(404).json({ message: "Candidat non trouvé" });
    }
    
    console.log('Candidat trouvé:', candidate._id);
    res.status(200).json(candidate);
  } catch (error) {
    console.error('Erreur getCandidateById:', error.message);
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * 🔎 Récupérer la candidature du candidat connecté pour une offre donnée
 */
export const getMyCandidateByOffer = async (req, res) => {
  try {
    console.log('=== GET MY CANDIDATE BY OFFER ===');
    console.log('User ID:', req.userId);
    console.log('Offre ID:', req.params.offreId);
    
    const userId = new mongoose.Types.ObjectId(req.userId);
    const offreId = new mongoose.Types.ObjectId(req.params.offreId);
    
    const candidate = await Candidate.findOne({ user: userId, offre: offreId })
      .populate("user", "nom prenoms email telephone adresse")
      .populate("offre", "titre description");
      
    if (!candidate) {
      console.log('Candidature non trouvée pour cette offre');
      return res.status(404).json({ message: "Candidature non trouvée pour cette offre" });
    }
    
    console.log('Candidature trouvée:', candidate._id);
    res.status(200).json(candidate);
  } catch (error) {
    console.error('Erreur getMyCandidateByOffer:', error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message || error });
  }
};

/**
 * 🎯 Récupérer toutes les candidatures liées à une offre
 */
export const getCandidatesByOffer = async (req, res) => {
  try {
    console.log('=== GET CANDIDATES BY OFFER ===');
    console.log('Offre ID:', req.params.id);
    
    const id = new mongoose.Types.ObjectId(req.params.id);
    const candidates = await Candidate.find({ offre: id })
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 });
      
    console.log('Candidatures trouvées:', candidates.length);
    res.status(200).json(candidates);
  } catch (error) {
    console.error('Erreur getCandidatesByOffer:', error.message);
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * ❌ Supprimer un candidat
 */
export const deleteCandidate = async (req, res) => {
  try {
    console.log('=== DELETE CANDIDATE ===');
    console.log('Candidate ID to delete:', req.params.id);
    
    const result = await Candidate.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Candidat non trouvé" });
    }
    
    console.log('Candidat supprimé avec succès');
    res.status(200).json({ message: "Candidat supprimé" });
  } catch (error) {
    console.error('Erreur deleteCandidate:', error.message);
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

/**
 * ❌❌ Supprimer plusieurs candidats
 */
export const deleteManyCandidates = async (req, res) => {
  try {
    console.log('=== DELETE MANY CANDIDATES ===');
    const { ids } = req.body;
    console.log('IDs to delete:', JSON.stringify(ids, null, 2));
    
    const result = await Candidate.deleteMany({ _id: { $in: ids } });
    console.log('Candidates deleted:', result.deletedCount);
    
    res.status(200).json({ 
      message: "Candidats supprimés", 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Erreur deleteManyCandidates:', error.message);
    res.status(500).json({ message: "Erreur lors de la suppression multiple", error: error.message });
  }
};

/**
 * 🔎 Récupérer toutes les candidatures d'un utilisateur spécifique
 */
export const getCandidatesByUser = async (req, res) => {
  try {
    console.log('=== GET CANDIDATES BY USER ===');
    console.log('User ID:', req.params.userId);
    
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    
    const candidates = await Candidate.find({ user: userId })
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 }); // Plus récent en premier
    
    console.log('Candidatures trouvées pour cet utilisateur:', candidates.length);
    res.status(200).json(candidates);
  } catch (error) {
    console.error('Erreur getCandidatesByUser:', error.message);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des candidatures de l'utilisateur", 
      error: error.message || error 
    });
  }
};
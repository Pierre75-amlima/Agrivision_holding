import mongoose from "mongoose";
import Candidate from "../models/candidate.js";
import Offre from "../models/offre.js";
import { getCloudinaryUrl } from "../config/cloudinary.js";

/**
 * ➕ Créer ou mettre à jour une candidature (user + offre)
 */
export const createOrUpdateCandidate = async (req, res) => {
  try {
    const body = { ...req.body };

    // Parser champs JSON encodés en string (FormData)
    if (body.competences && typeof body.competences === 'string') {
      try { body.competences = JSON.parse(body.competences); } catch (e) { console.warn('Competences parse failed:', e.message); }
    }
    if (body.experiences && typeof body.experiences === 'string') {
      try { body.experiences = JSON.parse(body.experiences); } catch (e) { console.warn('Experiences parse failed:', e.message); }
    }

    // CORRECTION : CV uploadé
    if (req.file) {
      console.log('Fichier uploadé :', req.file);
      console.log('Public ID :', req.file.public_id);
      console.log('Secure URL :', req.file.secure_url);
      console.log('MIME type :', req.file.mimetype);

      // UTILISER DIRECTEMENT L'URL SÉCURISÉE DE CLOUDINARY
      body.cvUrl = req.file.secure_url;
      
      // Alternative si secure_url n'est pas disponible :
      if (!body.cvUrl && req.file.public_id) {
        const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
        body.cvUrl = getCloudinaryUrl(req.file.public_id, resourceType);
      }
    }

    // Attacher l'utilisateur
    if (!body.user) {
      if (req.userId) body.user = req.userId;
      else if (req.user?.id) body.user = req.user.id;
      else return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const userId = new mongoose.Types.ObjectId(body.user);
    const offreId = new mongoose.Types.ObjectId(body.offre);

    // Vérifier si candidature existante
    let candidate = await Candidate.findOne({ user: userId, offre: offreId });

    if (candidate) {
      Object.assign(candidate, body);
      candidate.dateSoumission = Date.now();
      await candidate.save();
      return res.status(200).json(candidate);
    } else {
      candidate = new Candidate({ ...body, user: userId, offre: offreId });
      await candidate.save();
      return res.status(201).json(candidate);
    }

  } catch (error) {
    console.error('Erreur dans createOrUpdateCandidate :', error);
    return res.status(500).json({ message: "Erreur lors de l'enregistrement", error: error.message || error });
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

    const candidates = await Candidate.aggregate(pipeline);
    res.status(200).json(candidates);

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * 📌 Version alternative simple mais plus flexible
 */
export const getAllCandidatesSimple = async (req, res) => {
  try {
    const { search, poste, statut, competences } = req.query;
    const candidates = await Candidate.find({})
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 });

    let filtered = candidates;

    // Recherche nom/prénom
    if (search && search.trim()) {
      const s = normalizeSearchTerm(search);
      filtered = filtered.filter(c => `${c.user?.nom || ''} ${c.user?.prenoms || ''}`.toLowerCase().includes(s));
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
    }

    // Statut
    if (statut) filtered = filtered.filter(c => c.statut === statut);

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
    }

    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

/**
 * 🔎 Récupérer une candidature par ID
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
 * 🔎 Récupérer la candidature du candidat connecté pour une offre donnée
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
 * 🎯 Récupérer toutes les candidatures liées à une offre
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
 * ❌ Supprimer un candidat
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
 * ❌❌ Supprimer plusieurs candidats
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
 * 🔎 Récupérer toutes les candidatures d'un utilisateur spécifique
 */
export const getCandidatesByUser = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    
    const candidates = await Candidate.find({ user: userId })
      .populate("user", "nom prenoms email")
      .populate("offre", "titre description")
      .sort({ dateSoumission: -1 }); // Plus récent en premier
    
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la récupération des candidatures de l'utilisateur", 
      error: error.message || error 
    });
  }
};
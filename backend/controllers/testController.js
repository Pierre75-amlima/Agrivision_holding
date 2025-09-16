import Test from "../models/test.js";
import mongoose from "mongoose";

// CREATE
export const createTest = async (req, res) => {
  try {
    const { titre, description, questions, duree, scoreMinimum, offreId } = req.body;

    if (!titre || !description || !questions || !duree) {
      return res.status(400).json({ message: 'Les champs titre, description, questions et durée sont obligatoires.' });
    }

    const nouveauTest = new Test({
      titre,
      description,
      questions,
      duree,
      scoreMinimum: scoreMinimum || 0,
      offreId: offreId || null,
    });

    await nouveauTest.save();
    res.status(201).json(nouveauTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la création du test" });
  }
};

// READ all
export const getTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .sort({ dateCreation: -1 })
      .populate("offreId", "titre");
    res.json(tests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des tests" });
  }
};

// READ one
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).populate("offreId", "titre");
    if (!test) return res.status(404).json({ message: "Test non trouvé" });
    res.json(test);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération du test" });
  }
};

// UPDATE
export const updateTest = async (req, res) => {
  try {
    const { _id, offreId, ...rest } = req.body;

    const data = {
      ...rest,
      ...(offreId ? { offreId } : { $unset: { offreId: 1 } }) // supprime offreId si vide
    };

    const updatedTest = await Test.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!updatedTest) return res.status(404).json({ message: "Test non trouvé" });

    res.json(updatedTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du test" });
  }
};


// DELETE
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ message: "Test non trouvé" });
    res.json({ message: "Test supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du test" });
  }
};

// READ by offreId


export const getTestByOffre = async (req, res) => {
  try {
    const { offreId } = req.params;
    console.log("🔎 offreId reçu dans params:", offreId);

    const queryOffreId = new mongoose.Types.ObjectId(offreId);
    console.log("🔎 queryOffreId construit:", queryOffreId);

    const test = await Test.findOne({ offreId: queryOffreId }).populate("offreId", "titre");

    if (!test) {
      return res.status(404).json({ message: "Aucun test associé à cette offre" });
    }

    console.log("✅ test trouvé:", test);
    return res.status(200).json(test);
  } catch (error) {
    console.error("❌ Erreur dans getTestByOffre:", error.message, error.stack); // 👈 log plus détaillé
    return res.status(500).json({ 
      message: "Erreur serveur lors de la récupération du test par offre",
      error: error.message // 👈 retourne aussi le détail pour comprendre
    });
  }
};


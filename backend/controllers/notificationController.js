import mongoose from "mongoose";
import Notification from "../models/notification.js";
import User from "../models/user.js";

/**
 * 📋 Récupérer toutes les notifications d'un utilisateur
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, statut, type } = req.query;

    // Construire les filtres
    let filtres = { destinataire: userId };
    
    if (statut) {
      filtres.statut = statut;
    }
    
    if (type) {
      filtres.type = type;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const notifications = await Notification.find(filtres)
      .populate("contexte.candidatureId", "user offre")
      .populate("contexte.offreId", "titre")
      .populate("contexte.testId", "titre")
      .populate("contexte.userId", "nom prenoms email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Notification.countDocuments(filtres);

    res.status(200).json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des notifications", 
      error: error.message 
    });
  }
};

/**
 * 🔔 Compter les notifications non lues
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const count = await Notification.compterNonLues(userId);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Erreur comptage notifications:", error);
    res.status(500).json({ 
      message: "Erreur lors du comptage des notifications", 
      error: error.message 
    });
  }
};

/**
 * ✅ Marquer une notification comme lue
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({ 
      _id: id, 
      destinataire: userId 
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    await notification.marquerCommeLue();
    res.status(200).json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("Erreur marquer comme lue:", error);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour", 
      error: error.message 
    });
  }
};

/**
 * ✅ Marquer toutes les notifications comme lues
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { destinataire: userId, statut: "NON_LUE" },
      { statut: "LUE" }
    );

    res.status(200).json({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    console.error("Erreur marquer toutes comme lues:", error);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour", 
      error: error.message 
    });
  }
};

/**
 * 🗃️ Archiver une notification
 */
export const archiveNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({ 
      _id: id, 
      destinataire: userId 
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    await notification.archiver();
    res.status(200).json({ message: "Notification archivée" });
  } catch (error) {
    console.error("Erreur archivage notification:", error);
    res.status(500).json({ 
      message: "Erreur lors de l'archivage", 
      error: error.message 
    });
  }
};

/**
 * 🗑️ Supprimer une notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      destinataire: userId 
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    res.status(200).json({ message: "Notification supprimée" });
  } catch (error) {
    console.error("Erreur suppression notification:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression", 
      error: error.message 
    });
  }
};

/**
 * ➕ Créer une notification (utilisé en interne par les services)
 */
export const createNotification = async (req, res) => {
  try {
    const {
      destinataire,
      type,
      titre,
      message,
      contexte,
      lienAction,
      priorite = "NORMALE"
    } = req.body;

    const notification = await Notification.creerNotification({
      destinataire,
      type,
      titre,
      message,
      contexte,
      lienAction,
      priorite
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Erreur création notification:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création de la notification", 
      error: error.message 
    });
  }
};

/**
 * 📊 Obtenir les statistiques des notifications
 */
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Notification.aggregate([
      { $match: { destinataire: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$statut",
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: { destinataire: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({ stats, typeStats });
  } catch (error) {
    console.error("Erreur statistiques notifications:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des statistiques", 
      error: error.message 
    });
  }
};
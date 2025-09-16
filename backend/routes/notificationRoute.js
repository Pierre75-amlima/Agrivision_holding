import express from "express";
import { verifyToken } from "../middlewares/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  createNotification,
  getNotificationStats
} from "../controllers/notificationController.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

/**
 * @route   GET /api/notifications
 * @desc    Récupérer les notifications de l'utilisateur connecté
 * @access  Private
 */
router.get("/", getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Compter les notifications non lues
 * @access  Private
 */
router.get("/unread-count", getUnreadCount);

/**
 * @route   GET /api/notifications/stats
 * @desc    Obtenir les statistiques des notifications
 * @access  Private
 */
router.get("/stats", getNotificationStats);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
router.put("/:id/read", markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private
 */
router.put("/mark-all-read", markAllAsRead);

/**
 * @route   PUT /api/notifications/:id/archive
 * @desc    Archiver une notification
 * @access  Private
 */
router.put("/:id/archive", archiveNotification);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Supprimer une notification
 * @access  Private
 */
router.delete("/:id", deleteNotification);

/**
 * @route   POST /api/notifications
 * @desc    Créer une nouvelle notification (usage interne)
 * @access  Private (Admin only - vous pouvez ajouter un middleware admin)
 */
router.post("/", createNotification);

export default router;
import Notification from "../models/notification.js";
import User from "../models/user.js";

/**
 * Service pour créer et gérer les notifications automatiques
 */
class NotificationService {
  
  /**
   * Créer une notification pour nouvelle candidature
   */
  static async creerNotificationNouvelleCandidature(candidature) {
    try {
      // Récupérer les admins/RH qui doivent être notifiés
      const admins = await User.find({ role: "admin" });
      
      for (const admin of admins) {
        await Notification.creerNotification({
          destinataire: admin._id,
          type: "NOUVELLE_CANDIDATURE",
          titre: "Nouvelle candidature reçue",
          message: `${candidature.user.prenoms || candidature.user.nom} a postulé pour le poste "${candidature.offre.titre}".`,
          contexte: {
            candidatureId: candidature._id,
            offreId: candidature.offre._id,
            userId: candidature.user._id
          },
          lienAction: `/admin/candidatures/${candidature._id}`,
          priorite: "NORMALE",
          metadonnees: {
            icone: "👤",
            couleur: "#3B82F6",
            categorie: "candidature"
          }
        });
      }
    } catch (error) {
      console.error("Erreur création notification nouvelle candidature:", error);
    }
  }

  /**
   * Créer une notification pour test terminé
   */
  static async creerNotificationTestTermine(testResult) {
    try {
      // Notifier les admins
      const admins = await User.find({ role: "admin" });
      
      for (const admin of admins) {
        await Notification.creerNotification({
          destinataire: admin._id,
          type: "TEST_TERMINE",
          titre: "Test terminé par un candidat",
          message: `Le candidat a terminé le test "${testResult.test.titre}" avec un score de ${testResult.score}%.`,
          contexte: {
            testId: testResult.test._id,
            userId: testResult.candidat._id
          },
          lienAction: `/admin/tests/resultats/${testResult._id}`,
          priorite: testResult.score >= 70 ? "HAUTE" : "NORMALE",
          metadonnees: {
            icone: "📝",
            couleur: testResult.score >= 70 ? "#10B981" : "#F59E0B",
            categorie: "test"
          }
        });
      }

      // Notifier le candidat du résultat
      await Notification.creerNotification({
        destinataire: testResult.candidat._id,
        type: "TEST_TERMINE",
        titre: "Résultat de votre test",
        message: `Vous avez terminé le test "${testResult.test.titre}". Votre score : ${testResult.score}%.`,
        contexte: {
          testId: testResult.test._id
        },
        lienAction: "/candidat/mes-tests",
        priorite: "NORMALE",
        metadonnees: {
          icone: "✅",
          couleur: "#10B981",
          categorie: "resultat"
        }
      });
    } catch (error) {
      console.error("Erreur création notification test terminé:", error);
    }
  }

  /**
   * Créer une notification pour candidature acceptée
   */
  static async creerNotificationCandidatureAcceptee(candidature) {
    try {
      await Notification.creerNotification({
        destinataire: candidature.user._id,
        type: "CANDIDATURE_ACCEPTEE",
        titre: "🎉 Candidature acceptée !",
        message: `Félicitations ! Votre candidature pour le poste "${candidature.offre.titre}" a été acceptée.`,
        contexte: {
          candidatureId: candidature._id,
          offreId: candidature.offre._id
        },
        lienAction: `/candidat/candidatures/${candidature._id}`,
        priorite: "HAUTE",
        metadonnees: {
          icone: "🎉",
          couleur: "#10B981",
          categorie: "candidature"
        }
      });
    } catch (error) {
      console.error("Erreur création notification candidature acceptée:", error);
    }
  }

  /**
   * Créer une notification pour candidature rejetée
   */
  static async creerNotificationCandidatureRejetee(candidature, motif = "") {
    try {
      let message = `Votre candidature pour le poste "${candidature.offre.titre}" n'a pas été retenue.`;
      if (motif) {
        message += ` Motif : ${motif}`;
      }

      await Notification.creerNotification({
        destinataire: candidature.user._id,
        type: "CANDIDATURE_REJETEE",
        titre: "Candidature non retenue",
        message,
        contexte: {
          candidatureId: candidature._id,
          offreId: candidature.offre._id
        },
        lienAction: "/candidat/offres",
        priorite: "NORMALE",
        metadonnees: {
          icone: "❌",
          couleur: "#EF4444",
          categorie: "candidature"
        }
      });
    } catch (error) {
      console.error("Erreur création notification candidature rejetée:", error);
    }
  }

  /**
   * Créer une notification pour nouveau test assigné
   */
  static async creerNotificationNouveauTestAssigne(test, candidat) {
    try {
      await Notification.creerNotification({
        destinataire: candidat._id,
        type: "NOUVEAU_TEST_ASSIGNE",
        titre: "Nouveau test à passer",
        message: `Un nouveau test "${test.titre}" vous a été assigné. Vous avez ${test.dureeMinutes} minutes pour le compléter.`,
        contexte: {
          testId: test._id,
          userId: candidat._id
        },
        lienAction: `/candidat/tests/${test._id}`,
        priorite: "HAUTE",
        metadonnees: {
          icone: "📋",
          couleur: "#3B82F6",
          categorie: "test"
        }
      });
    } catch (error) {
      console.error("Erreur création notification nouveau test:", error);
    }
  }

  /**
   * Créer une notification pour entretien programmé
   */
  static async creerNotificationEntretienProgramme(entretien, candidat) {
    try {
      const dateEntretien = new Date(entretien.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await Notification.creerNotification({
        destinataire: candidat._id,
        type: "ENTRETIEN_PROGRAMME",
        titre: "Entretien programmé",
        message: `Votre entretien est programmé le ${dateEntretien}. Lieu : ${entretien.lieu || "À définir"}.`,
        contexte: {
          userId: candidat._id
        },
        lienAction: "/candidat/entretiens",
        priorite: "HAUTE",
        metadonnees: {
          icone: "📅",
          couleur: "#8B5CF6",
          categorie: "entretien"
        }
      });
    } catch (error) {
      console.error("Erreur création notification entretien:", error);
    }
  }

  /**
   * Créer une notification pour document requis
   */
  static async creerNotificationDocumentRequis(candidat, typeDocument) {
    try {
      await Notification.creerNotification({
        destinataire: candidat._id,
        type: "DOCUMENT_REQUIS",
        titre: "Document requis",
        message: `Veuillez fournir le document suivant : ${typeDocument}. Votre dossier ne peut pas être traité sans ce document.`,
        contexte: {
          userId: candidat._id
        },
        lienAction: "/candidat/documents",
        priorite: "HAUTE",
        metadonnees: {
          icone: "📄",
          couleur: "#F59E0B",
          categorie: "document"
        }
      });
    } catch (error) {
      console.error("Erreur création notification document requis:", error);
    }
  }

  /**
   * Créer une notification de rappel de test
   */
  static async creerNotificationRappelTest(test, candidat, tempsRestant) {
    try {
      await Notification.creerNotification({
        destinataire: candidat._id,
        type: "RAPPEL_TEST",
        titre: "Rappel : Test en attente",
        message: `N'oubliez pas de passer votre test "${test.titre}". Il vous reste ${tempsRestant} pour le compléter.`,
        contexte: {
          testId: test._id,
          userId: candidat._id
        },
        lienAction: `/candidat/tests/${test._id}`,
        priorite: "HAUTE",
        metadonnees: {
          icone: "⏰",
          couleur: "#F59E0B",
          categorie: "rappel"
        }
      });
    } catch (error) {
      console.error("Erreur création notification rappel test:", error);
    }
  }

  /**
   * Créer une notification pour mise à jour de profil requise
   */
  static async creerNotificationMiseAJourProfil(candidat, champsManquants) {
    try {
      await Notification.creerNotification({
        destinataire: candidat._id,
        type: "MISE_A_JOUR_PROFIL",
        titre: "Complétez votre profil",
        message: `Votre profil est incomplet. Champs manquants : ${champsManquants.join(", ")}. Complétez-le pour améliorer vos chances.`,
        contexte: {
          userId: candidat._id
        },
        lienAction: "/candidat/profil",
        priorite: "NORMALE",
        metadonnees: {
          icone: "👤",
          couleur: "#6B7280",
          categorie: "profil"
        }
      });
    } catch (error) {
      console.error("Erreur création notification mise à jour profil:", error);
    }
  }

  /**
   * Envoyer des notifications groupées (pour les admins)
   */
  static async envoyerNotificationsBatch(notifications) {
    try {
      const results = [];
      for (const notifData of notifications) {
        const notification = await Notification.creerNotification(notifData);
        results.push(notification);
      }
      return results;
    } catch (error) {
      console.error("Erreur envoi notifications batch:", error);
      throw error;
    }
  }

  /**
   * Supprimer les anciennes notifications (maintenance)
   */
  static async nettoyerAnciennesNotifications(joursAnciennete = 30) {
    try {
      const datelimite = new Date();
      dateLimit.setDate(dateLimit.getDate() - joursAnciennete);

      const result = await Notification.deleteMany({
        createdAt: { $lt: dateLimit },
        statut: { $in: ["LUE", "ARCHIVEE"] }
      });

      console.log(`${result.deletedCount} anciennes notifications supprimées`);
      return result;
    } catch (error) {
      console.error("Erreur nettoyage notifications:", error);
      throw error;
    }
  }
}

export default NotificationService;
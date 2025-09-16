import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // Destinataire de la notification
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Type de notification
  type: {
    type: String,
    enum: [
      "NOUVELLE_CANDIDATURE",
      "TEST_TERMINE",
      "CANDIDATURE_ACCEPTEE",
      "CANDIDATURE_REJETEE",
      "NOUVEAU_TEST_ASSIGNE",
      "ENTRETIEN_PROGRAMME",
      "DOCUMENT_REQUIS",
      "RAPPEL_TEST",
      "MISE_A_JOUR_PROFIL"
    ],
    required: true
  },
  
  // Titre de la notification
  titre: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  // Message détaillé
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Données contextuelles (candidature, test, offre, etc.)
  contexte: {
    candidatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate"
    },
    offreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offre"
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test"
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  
  // Lien vers une action spécifique
  lienAction: {
    type: String,
    default: null
  },
  
  // Statut de la notification
  statut: {
    type: String,
    enum: ["NON_LUE", "LUE", "ARCHIVEE"],
    default: "NON_LUE"
  },
  
  // Priorité
  priorite: {
    type: String,
    enum: ["BASSE", "NORMALE", "HAUTE", "URGENTE"],
    default: "NORMALE"
  },
  
  // Métadonnées pour personnalisation
  metadonnees: {
    icone: String,
    couleur: String,
    categorie: String
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
notificationSchema.index({ destinataire: 1, statut: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// Méthodes du schéma
notificationSchema.methods.marquerCommeLue = function() {
  this.statut = "LUE";
  return this.save();
};

notificationSchema.methods.archiver = function() {
  this.statut = "ARCHIVEE";
  return this.save();
};

// Méthodes statiques
notificationSchema.statics.creerNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Ici vous pouvez ajouter la logique pour envoyer en temps réel
  // via WebSocket, Socket.IO, etc.
  
  return notification;
};

notificationSchema.statics.obtenirNonLues = function(userId) {
  return this.find({
    destinataire: userId,
    statut: "NON_LUE"
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.compterNonLues = function(userId) {
  return this.countDocuments({
    destinataire: userId,
    statut: "NON_LUE"
  });
};

export default mongoose.model("Notification", notificationSchema);
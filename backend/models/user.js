import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenoms: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  motDePasse: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'candidat'],
    default: 'candidat'
  },
  candidat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    default: null
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  mustChangePassword: {
    type: Boolean,
    default: function() {
      return this.role === 'admin';
    }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);

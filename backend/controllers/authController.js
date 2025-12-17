import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Enregistrement d’un nouvel utilisateur
export const register = async (req, res) => {
  try {
    const { nom, prenoms, email, motDePasse, role } = req.body;

    // Vérifie si l’email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      nom,
      prenoms,
      email,
      motDePasse: hashedPassword,
      role: role || 'candidat',
      // mustChangePassword est déjà géré dans le schema (true pour admin, false pour candidat)
    });

    await newUser.save();

    res.status(201).json({ message: 'Utilisateur enregistré avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de l’inscription.' });
  }
};

// Connexion d’un utilisateur avec gestion première connexion
export const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Vérifie si l’utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur introuvable.' });
    }

    // Vérifie le mot de passe
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect.' });
    }

    // Crée le token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(200).json({
      message: 'Connexion réussie.',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenoms: user.prenoms,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword, // <-- directement en base
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};

// Changement de mot de passe
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // récupéré depuis le middleware auth
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const isMatch = await bcrypt.compare(oldPassword, user.motDePasse);
    if (!isMatch) return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.motDePasse = hashedPassword;

    // 🚀 Ici, on désactive l’obligation de changer le mot de passe
    user.mustChangePassword = false;

    await user.save();

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du mot de passe.' });
  }
};

// Créer un administrateur (route temporaire pour setup)
export const createAdmin = async (req, res) => {
  try {
    const { nom, prenoms, email, motDePasse } = req.body;

    // Vérifie si l’email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer un nouvel administrateur
    const newAdmin = new User({
      nom,
      prenoms,
      email,
      motDePasse: hashedPassword,
      role: 'admin',
      mustChangePassword: true
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Administrateur créé avec succès.',
      user: {
        id: newAdmin._id,
        nom: newAdmin.nom,
        prenoms: newAdmin.prenoms,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de l’administrateur.' });
  }
};

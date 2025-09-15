import express from 'express';
import { register, login, changePassword} from '../controllers/authController.js';
import { verifyToken } from "../middlewares/auth.js";



const router = express.Router();

// Inscription
router.post('/register', register);

// Connexion
router.post('/login', login);

// Changement de mot de passe (protégé)
router.post("/change-password", verifyToken, changePassword);



export default router;

import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

import offreRoutes from './routes/offreRoutes.js';
import candidatRoutes from './routes/candidateRoutes.js';
import testRoutes from './routes/testRoutes.js';
import testResultRoutes from "./routes/testResultRoutes.js";
import infoPostEntretienRoutes from "./routes/infoPostentretienRoutes.js";
import notificationRoutes from "./routes/notificationRoute.js";




dotenv.config();

const app = express();
// logger global - à mettre après `const app = express();`
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});
const PORT = process.env.PORT || 5000;

// Connexion à MongoDB via la fonction dédiée
connectDB();

app.use(cors());

app.use(express.json());

app.use('/api/offres', offreRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/candidats', candidatRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/testResults", testResultRoutes);
app.use("/api/info-post-entretien", infoPostEntretienRoutes);
app.use("/api/notifications", notificationRoutes);




app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend Agrivision 🚀');
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://agrivision-holding.onrender.com:${PORT}`);
});

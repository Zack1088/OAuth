// image-server/server.js
require('dotenv').config();
const app = require('./app');
const connectDb = require('./config/database');

const PORT = process.env.PORT || 4000;

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`📡 Serveur démarré sur le port ${PORT} en mode ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('🚫 Erreur au démarrage du serveur:', err);
    process.exit(1);
  }
};

startServer();
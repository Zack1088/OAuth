// image-server/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const Token = require('../models/token.model');

exports.verifyToken = async (req, res, next) => {
  try {
    console.log('Headers:', req.headers);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token non fourni' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token reçu:', token); 

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé:', decoded); 

      // Vérifier si le token existe dans la base de données
      const tokenDoc = await Token.findOne({ 
        token: decoded.token,
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
      }
      req.clientId = tokenDoc.clientId;
      next();
    } catch (err) {
      console.error('Erreur de vérification JWT:', err);
      return res.status(401).json({ error: 'Token invalide' });
    }
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    res.status(500).json({ error: error.message });
  }
};

// Middleware pour vérifier le token admin
exports.verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token admin non fourni' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
    res.status(401).json({ error: 'Token admin invalide' });
  }
};
// image-server/utils/token.utils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Token = require('../models/token.model');

// Génère un token JWT
const generateJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

// Génère un token d'accès aléatoire
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Génère un nouveau token d'accès
const generateAccessToken = async (clientId) => {
  try {
    const randomToken = generateRandomToken();
    
    // Créer un nouveau document Token
    await Token.create({
      token: randomToken,
      clientId,
      expiresAt: new Date(Date.now() + 3600 * 1000) // 1 heure
    });

    // Générer le JWT
    return generateJWT({ token: randomToken });
  } catch (error) {
    console.error('Erreur génération token:', error);
    throw error;
  }
};

// Vérifie si un token est valide
const verifyToken = async (token) => {
  try {
    // Décode le JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifie si le token existe dans la base de données et n'est pas expiré
    const tokenDoc = await Token.findOne({
      token: decoded.token,
      expiresAt: { $gt: new Date() }
    });

    return !!tokenDoc;
  } catch (error) {
    return false;
  }
};

// Révoque un token
const revokeToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await Token.findOneAndDelete({ token: decoded.token });
    return true;
  } catch (error) {
    return false;
  }
};

// Nettoie les tokens expirés
const cleanExpiredTokens = async () => {
  try {
    await Token.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return true;
  } catch (error) {
    console.error('Erreur lors du nettoyage des tokens expirés:', error);
    return false;
  }
};

// Vérifie si un token appartient à un client spécifique
const verifyTokenOwnership = async (token, clientId) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenDoc = await Token.findOne({
      token: decoded.token,
      clientId: clientId,
      expiresAt: { $gt: new Date() }
    });
    return !!tokenDoc;
  } catch (error) {
    return false;
  }
};

// Renouvelle un token
const refreshToken = async (oldToken, clientId) => {
  try {
    // Vérifie d'abord si l'ancien token est valide
    const isValid = await verifyTokenOwnership(oldToken, clientId);
    if (!isValid) {
      throw new Error('Token invalide ou expiré');
    }

    // Révoque l'ancien token
    await revokeToken(oldToken);

    // Génère un nouveau token
    const newToken = await generateAccessToken();
    
    // Sauvegarde le nouveau token
    const tokenDoc = new Token({
      token: newToken,
      clientId: clientId,
      expiresAt: new Date(Date.now() + (3600 * 1000)) // 1 heure
    });
    await tokenDoc.save();

    return newToken;
  } catch (error) {
    throw new Error('Erreur lors du renouvellement du token');
  }
};

// Obtient les informations d'un token
const getTokenInfo = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenDoc = await Token.findOne({
      token: decoded.token
    }).select('-__v');

    if (!tokenDoc) {
      throw new Error('Token non trouvé');
    }

    return {
      id: tokenDoc._id,
      clientId: tokenDoc.clientId,
      createdAt: tokenDoc.createdAt,
      expiresAt: tokenDoc.expiresAt,
      isExpired: tokenDoc.expiresAt < new Date(),
      timeToExpiry: tokenDoc.expiresAt - new Date()
    };
  } catch (error) {
    throw new Error('Erreur lors de la récupération des informations du token');
  }
};

module.exports = {
  generateJWT,
  generateRandomToken,
  generateAccessToken,
  verifyToken,
  revokeToken,
  cleanExpiredTokens,
  verifyTokenOwnership,
  refreshToken,
  getTokenInfo
};
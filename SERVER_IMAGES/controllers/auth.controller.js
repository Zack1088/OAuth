// image-server/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const {
    generateAccessToken,
    refreshToken,
    revokeToken
} = require('../utils/token.utils');
  const Client = require('../models/client.model');
  
exports.getToken = async (req, res) => {
  try {
    const { client_id, client_secret } = req.body;

    if (!client_id || !client_secret) {
      return res.status(400).json({
        success: false,
        message: 'ID client et secret client requis'
      });
    }

    const client = await Client.findOne({
      clientId: client_id,
      clientSecret: client_secret
    });

    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Identifiants client invalides'
      });
    }

    const token = await generateAccessToken(client_id);

    res.json({
      success: true,
      data: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600
      }
    });
  } catch (error) {
    console.error('Erreur getToken:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
  
  exports.refreshToken = async (req, res) => {
    try {
      const { old_token, client_id } = req.body;
  
      if (!old_token || !client_id) {
        return res.status(400).json({
          success: false,
          message: 'Token et ID client requis'
        });
      }
  
      const newToken = await refreshToken(old_token, client_id);
  
      res.json({
        success: true,
        data: {
          access_token: newToken,
          token_type: 'Bearer',
          expires_in: 3600
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  
  exports.revokeToken = async (req, res) => {
    try {
      const { token } = req.body;
  
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token requis'
        });
      }
  
      await revokeToken(token);
  
      res.json({
        success: true,
        message: 'Token révoqué avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  
  exports.verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.body.token) {
            token = req.body.token;
        }

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token requis'
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token décodé:', decoded);
        res.json({
            success: true,
            data: {
                isValid: true,
                decoded
            }
        });
    } catch (error) {
        console.error('Erreur vérification token:', error);
        res.status(401).json({
            success: false,
            message: 'Token invalide',
            error: error.message
        });
    }
};
// image-server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Route pour obtenir un token
router.post('/token', authController.getToken);

// Route pour rafraîchir un token
router.post('/refresh-token', authController.refreshToken);

// Route pour révoquer un token
router.post('/revoke', authController.revokeToken);

// Route pour vérifier un token
router.post('/verify', authController.verifyToken);

module.exports = router;
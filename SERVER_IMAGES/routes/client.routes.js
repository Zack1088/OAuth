// image-server/routes/client.routes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { verifyAdmin } = require('../middleware/admin.middleware');

// Route pour créer un client (protégée par admin)
router.post('/', verifyAdmin, (req, res, next) => {
    console.log('Route création client appelée');
    next();
}, clientController.createClient);

// Route pour obtenir tous les clients
router.get('/', clientController.getAllClients);

// Route pour obtenir un client spécifique
router.get('/:clientId', clientController.getClient);

// Route pour mettre à jour un client
router.put('/:clientId', clientController.updateClient);

// Route pour supprimer un client
router.delete('/:clientId', clientController.deleteClient);

module.exports = router;
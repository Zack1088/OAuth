// image-server/controllers/client.controller.js
const crypto = require('crypto');
const Client = require('../models/client.model');

exports.createClient = async (req, res) => {
  try {
      console.log('Création client - body reçu:', req.body);
      const { name, description } = req.body;
      
      if (!name) {
          return res.status(400).json({
              success: false,
              message: 'Le nom du client est requis'
          });
      }

      // Générer les identifiants du client
      const clientId = crypto.randomBytes(16).toString('hex');
      const clientSecret = crypto.randomBytes(32).toString('hex');
      
      console.log('Identifiants générés:', { clientId, clientSecret });

      const client = await Client.create({
          name,
          description,
          clientId,
          clientSecret
      });

      res.status(201).json({
          success: true,
          data: {
              clientId: client.clientId,
              clientSecret: clientSecret, 
              name: client.name,
              description: client.description
          }
      });
  } catch (error) {
      console.error('Erreur création client:', error);
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find()
      .select('-clientSecret -__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ clientId: req.params.clientId })
      .select('-clientSecret -__v');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const client = await Client.findOneAndUpdate(
      { clientId: req.params.clientId },
      { 
        $set: { 
          name, 
          description,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    ).select('-clientSecret -__v');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ 
      clientId: req.params.clientId 
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
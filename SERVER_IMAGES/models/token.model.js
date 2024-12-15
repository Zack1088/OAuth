// image-server/models/token.model.js
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientId: {
    type: String,
    required: true,
    ref: 'Client'
  },
  type: {
    type: String,
    enum: ['access', 'refresh'],
    default: 'access'
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

// Index TTL pour supprimer automatiquement les tokens expirés
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthode pour vérifier si le token est expiré
tokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Méthode pour révoquer le token
tokenSchema.methods.revoke = async function() {
  this.isRevoked = true;
  await this.save();
};

module.exports = mongoose.model('Token', tokenSchema);
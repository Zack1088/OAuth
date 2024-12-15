// image-server/models/client.model.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedDomains: [{
    type: String,
    trim: true
  }],
  maxUploadSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB par défaut
  },
  quotaLimit: {
    type: Number,
    default: 100 * 1024 * 1024 // 100MB par défaut
  },
  currentQuotaUsed: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Méthode pour vérifier si le client a dépassé son quota
clientSchema.methods.hasExceededQuota = function(fileSize) {
  return (this.currentQuotaUsed + fileSize) > this.quotaLimit;
};

// Méthode pour mettre à jour le quota utilisé
clientSchema.methods.updateQuota = async function(fileSize) {
  this.currentQuotaUsed += fileSize;
  this.lastActivity = new Date();
  await this.save();
};

module.exports = mongoose.model('Client', clientSchema);
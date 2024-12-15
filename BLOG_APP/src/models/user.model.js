// src/models/user.model.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Veuillez entrer une adresse email valide']
    },
    username: {
        type: String,
        required: [true, 'Le nom d\'utilisateur est requis'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return this.provider === 'local';
        }
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'discord'],
        default: 'local'
    },
    googleId: String,
    displayName: String,
    discordId: String,
    mfaEnabled: {
        type: Boolean,
        default: false
    },
    mfaSecret: String,
    accessToken: String,
    refreshToken: String
}, {
    timestamps: true
});

// Fonction pour initialiser un username quand c'est une connexion google ou discord
userSchema.pre('save', async function(next) {
    if (!this.username) {
        if (this.provider === 'google' && this.displayName) {
            this.username = this.displayName.replace(/\s+/g, '_').toLowerCase();
        } else if (this.provider === 'discord' && this.discordId) {
            this.username = this.discordId;
        } else if (this.email) {
            this.username = this.email.split('@')[0];
        }
        const User = this.constructor;
        let count = 0;
        let tempUsername = this.username;
        
        while (await User.findOne({ username: tempUsername })) {
            count++;
            tempUsername = `${this.username}_${count}`;
        }
        
        this.username = tempUsername;
    }
    next();
});
// Comparaison MDP
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
// Stockages des Tokens
userSchema.methods.storeToken = async function(token) {
    this.token = token;
    return await this.save();
};
module.exports = mongoose.model('User', userSchema);

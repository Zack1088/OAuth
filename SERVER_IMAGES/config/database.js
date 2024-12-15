// src/config/database.js
const mongoose = require('mongoose');

let isConnected = false;

const connectDb = async () => {
    if (isConnected) {
        console.log('✅ Déjà connecté à MongoDB');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);

        isConnected = true;
        console.log('✅ Connexion réussie à MongoDB');

        mongoose.connection.on('disconnected', () => {
            console.log('❌ Déconnecté de MongoDB');
            isConnected = false;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Erreur MongoDB:', err);
            isConnected = false;
        });

    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB:', error);
        throw error;
    }
};

module.exports = connectDb;
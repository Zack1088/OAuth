const express = require('express');
const multer = require('multer');
const cors = require('./middleware/cors.middleware');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Routes 
const imageRoutes = require('./routes/image.routes');
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');

const app = express();

// Middleware de base
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', (req, res, next) => {
  console.log(`Accès à un fichier dans /uploads: ${req.originalUrl}`);
  next();
}, express.static('uploads'));
app.use(morgan('dev'));

// Routes tests
app.get('/ping', (req, res) => {
    console.log('Route /ping appelée');
    res.json({ message: 'pong' });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Route admin (publique pour initialisé les credentials)
app.post('/init-admin', (req, res) => {
    console.log('Génération token admin');
    try {
        const token = jwt.sign(
            { isAdmin: true, role: 'admin' },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('Token admin généré avec succès');
        res.json({ success: true, token });
    } catch (error) {
        console.error('Erreur génération token:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route OAuth 
app.use('/oauth', authRoutes);

// Middleware de vérification JWT pour les routes protégées
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Erreur JWT:', err);
        res.status(401).json({ error: 'Token invalide' });
    }
};

// Routes statiques
app.use('/uploads', express.static('uploads'));

// Routes API protégées
app.use('/api/clients', clientRoutes); 
app.use('/api/images', authMiddleware, imageRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Le fichier est trop volumineux. Taille maximum: 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Erreur lors upload du fichier'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token invalide'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Une erreur est survenue sur le serveur'
    });
});

// Route 404
app.use((req, res) => {
    console.log('Route non trouvée:', req.originalUrl);
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

module.exports = app;
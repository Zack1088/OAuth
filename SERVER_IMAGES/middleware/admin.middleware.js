// middleware/admin.middleware.js
const jwt = require('jsonwebtoken');

exports.verifyAdmin = (req, res, next) => {
    console.log('Vérification admin - début');
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Token manquant dans les headers');
            return res.status(401).json({ error: 'Token admin requis' });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token reçu dans middleware admin:', token);

        const secret = process.env.ADMIN_JWT_SECRET;
        console.log('Secret utilisé:', secret);

        const decoded = jwt.verify(token, secret);
        console.log('Token décodé:', decoded);

        if (!decoded.isAdmin) {
            console.log('Token non admin');
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        console.log('Vérification admin réussie');
        req.admin = decoded;
        next();
    } catch (error) {
        console.error('Erreur vérification admin:', error);
        return res.status(401).json({ error: 'Token invalide' });
    }
};
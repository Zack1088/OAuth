const { verifyToken } = require('../config/jwt');
const User = require('../models/user.model');
const ActiveToken = require('../models/activeToken.model');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.session.token;
        console.log('Auth middleware - checking token');
       
        if (!token) {
            console.log('No token found');
            return res.redirect('/auth/login');
        }

        // Vérifier si le token est actif dans ActiveToken
        const activeToken = await ActiveToken.findOne({
            token: token,
            isValid: true
        });

        if (!activeToken) {
            console.log('Token not found in active tokens or invalid');
            res.clearCookie('token');
            delete req.session.token;
            return res.redirect('/auth/login');
        }

        // Mettre à jour lastUsed
        await ActiveToken.findByIdAndUpdate(activeToken._id, {
            lastUsed: new Date()
        });

        try {
            // Vérification du JWT pour tous les utilisateurs
            const decoded = verifyToken(token);
            if (!decoded) {
                throw new Error('Invalid token');
            }

            // Récupération de l'utilisateur
            const user = await User.findById(decoded._id);
            if (!user) {
                throw new Error('User not found');
            }

            // Vérification 2FA
            if (user.mfaEnabled && !decoded.is2FAVerified) {
                console.log('2FA required, redirecting to verification');
                // Ne pas rediriger si on est déjà sur une route 2FA
                if (!req.path.includes('/2fa/')) {
                    req.session.tempUserId = user._id;
                    return res.redirect('/auth/2fa/verify');
                }
            }

            // Mettre à jour req.user 
            req.user = user;
            res.locals.user = user;

            if (!req.cookies.token) {
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000,
                    sameSite: 'lax'
                });
            }

            // Ajouter les informations de session active aux locals
            res.locals.activeSession = {
                deviceInfo: activeToken.deviceInfo,
                lastUsed: activeToken.lastUsed
            };

            // Ajouter l'état de vérification 2FA aux locals
            res.locals.is2FAVerified = !user.mfaEnabled || decoded.is2FAVerified;
            req.user.is2FAVerified = !user.mfaEnabled || decoded.is2FAVerified;

            return next();
        } catch (error) {
            console.log('Token verification failed:', error.message);
            // Invalider le token actif en cas d'erreur
            await ActiveToken.findOneAndUpdate(
                { token },
                { isValid: false }
            );
            res.clearCookie('token');
            delete req.session.token;
            return res.redirect('/auth/login');
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.clearCookie('token');
        delete req.session.token;
        res.redirect('/auth/login');
    }
};

module.exports = auth;
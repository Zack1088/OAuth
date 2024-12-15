const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const User = require('../models/user.model');
const { generateToken } = require('../config/jwt');
const ActiveToken = require('../models/activeToken.model');

// Fonction setup
const setupMfa = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.mfaEnabled) {
            req.flash('error', 'La 2FA est déjà activée');
            return res.redirect('/blogs/my');
        }

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, 'Blog App', secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        req.session.mfaSecret = secret;
        req.session.mfaSetupTime = Date.now();

        res.render('auth/setup-2fa', {
            qrCodeUrl,
            secret,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Erreur setupMfa:', error);
        req.flash('error', 'Erreur lors de la configuration de la 2FA');
        res.redirect('/blogs/my');
    }
};

// Fonction de validation MFA
const validateMfa = async (req, res) => {
    try {
        const { token } = req.body;
        const secret = req.session.mfaSecret;
        const setupTime = req.session.mfaSetupTime;

        if (!secret || !setupTime || Date.now() - setupTime > 15 * 60 * 1000) {
            req.flash('error', 'Session expirée. Veuillez recommencer.');
            return res.redirect('/auth/2fa/setup');
        }

        const isValid = authenticator.verify({
            token,
            secret,
            window: 1
        });

        if (isValid) {
            const user = await User.findById(req.user._id);
            if (user.mfaEnabled) {
                req.flash('error', 'La 2FA est déjà activée');
                return res.redirect('/blogs/my');
            }

            // Génération d'un nouveau token avec 2FA activée
            const newToken = generateToken({
                _id: user._id,
                email: user.email,
                mfaEnabled: true,
                is2FAVerified: true
            });

            // Invalider l'ancien ActiveToken s'il existe
            const currentToken = req.cookies.token;
            if (currentToken) {
                await ActiveToken.findOneAndUpdate(
                    { token: currentToken },
                    { isValid: false }
                );
            }

            // Créer un nouveau ActiveToken
            await ActiveToken.create({
                userId: user._id,
                token: newToken,
                deviceInfo: req.headers['user-agent'] || 'Unknown Device',
                isValid: true,
                lastUsed: new Date()
            });

            // Mise à jour de l'utilisateur avec 2FA
            await User.findByIdAndUpdate(req.user._id, {
                mfaSecret: secret,
                mfaEnabled: true
            });

            // Mise à jour du cookie avec le nouveau token
            res.cookie('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            });

            delete req.session.mfaSecret;
            delete req.session.mfaSetupTime;

            console.log('2FA validated successfully for user:', user._id);

            req.flash('success', 'MFA activé avec succès');
            res.redirect('/blogs/my');
        } else {
            req.flash('error', 'Code incorrect. Veuillez réessayer.');
            res.redirect('/auth/2fa/setup');
        }
    } catch (error) {
        console.error('Erreur validateMfa:', error);
        req.flash('error', 'Erreur lors de la validation de la 2FA');
        res.redirect('/auth/2fa/setup');
    }
};

// Fonction de vérification MFA
const verifyMfa = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.session.tempUserId;
        
        if (!userId) {
            req.flash('error', 'Session expirée. Veuillez vous reconnecter.');
            return res.redirect('/auth/login');
        }

        const user = await User.findById(userId);
        
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            req.flash('error', 'Configuration 2FA invalide');
            return res.redirect('/auth/login');
        }

        const isValid = authenticator.verify({
            token,
            secret: user.mfaSecret,
            window: 1
        });

        if (isValid) {
            // Création d'un nouveau token avec 2FA vérifié
            const jwtToken = generateToken({
                _id: user._id,
                email: user.email,
                provider: user.provider,
                mfaEnabled: true,
                is2FAVerified: true
            });

            // Invalider l'ancien ActiveToken s'il existe
            await ActiveToken.updateMany(
                { userId: user._id, isValid: true },
                { isValid: false }
            );

            // Créer un nouveau ActiveToken
            await ActiveToken.create({
                userId: user._id,
                token: jwtToken,
                deviceInfo: req.headers['user-agent'] || 'Unknown Device',
                isValid: true,
                lastUsed: new Date()
            });
            
            // Configurer le cookie avec le nouveau token
            res.cookie('token', jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            });

            // Nettoyer la session
            delete req.session.tempUserId;
            delete req.session.loginAttempts;

            return res.redirect('/blogs/my');
        } else {
            req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;
            
            if (req.session.loginAttempts >= 5) {
                delete req.session.tempUserId;
                delete req.session.loginAttempts;
                req.flash('error', 'Trop de tentatives. Veuillez vous reconnecter.');
                return res.redirect('/auth/login');
            }

            req.flash('error', 'Code incorrect. Veuillez réessayer.');
            res.redirect('/auth/2fa/verify');
        }
    } catch (error) {
        console.error('Erreur verifyMfa:', error);
        req.flash('error', 'Erreur lors de la vérification de la 2FA');
        res.redirect('/auth/2fa/verify');
    }
};

// Fonction désactivation MFA
const disableMfa = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.mfaEnabled) {
            req.flash('error', 'La 2FA est déjà désactivée');
            return res.redirect('/blogs/my');
        }

        // Préparer le message flash avant de détruire la session
        req.flash('success', 'MFA désactivé avec succès. Veuillez vous reconnecter.');

        // Invalider l'ancien ActiveToken s'il existe
        const currentToken = req.cookies.token;
        if (currentToken) {
            await ActiveToken.findOneAndUpdate(
                { token: currentToken },
                { isValid: false }
            );
        }

        // Générer un nouveau token sans 2FA
        const newToken = generateToken({
            _id: user._id,
            email: user.email,
            provider: user.provider,
            mfaEnabled: false,
            is2FAVerified: false
        });

        // Désactiver 2FA et supprimer le secret
        await User.findByIdAndUpdate(user._id, {
            $unset: { mfaSecret: "" },
            mfaEnabled: false
        });

        // Créer un nouveau ActiveToken
        await ActiveToken.create({
            userId: user._id,
            token: newToken,
            deviceInfo: req.headers['user-agent'] || 'Unknown Device',
            isValid: true,
            lastUsed: new Date()
        });

        // Nettoyer les cookies et la session
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        });

        // Rediriger avant de détruire la session
        res.redirect('/auth/login');

        // Détruire la session après la redirection
        req.session.destroy((err) => {
            if (err) {
                console.error('Erreur lors de la destruction de la session:', err);
            }
        });

    } catch (error) {
        console.error('Erreur disableMfa:', error);
        req.flash('error', 'Erreur lors de la désactivation de la MFA');
        res.redirect('/blogs/my');
    }
};

// Gestion état du MFA
const manageMfa = async (req, res) => {
    try {
        console.log('Managing 2FA for user:', req.user._id);
        
        const user = await User.findById(req.user._id).select('mfaEnabled email provider');
        if (!user) {
            console.log('User not found in manageMfa');
            req.flash('error', 'Utilisateur non trouvé');
            return res.redirect('/auth/login');
        }

        res.render('auth/manage-2fa', { 
            user,
            messages: req.flash(),
            is2FAVerified: true 
        });
    } catch (error) {
        console.error('Erreur manageMfa:', error);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/blogs/my');
    }
};

module.exports = {
    setupMfa,
    validateMfa,
    verifyMfa,
    disableMfa,
    manageMfa
};
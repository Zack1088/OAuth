const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const ActiveToken = require('../models/activeToken.model');
const { generateToken } = require('../config/jwt');

const renderRegister = (req, res) => {
    res.render('auth/register', { error: null });
};

const register = async (req, res) => {
    try {
        const { email, username, password, confirmPassword } = req.body;

        // Trim and lowercase the email
        const trimmedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ $or: [{ email: trimmedEmail }, { username }] });
        if (existingUser) {
            return res.render('auth/register', {
                error: 'Cet email ou ce nom d\'utilisateur est déjà utilisé'
            });
        }

        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;
        if (!regex.test(password)) {
            return res.render('auth/register', {
                error: 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.'
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register', {
                error: 'Les mots de passe ne correspondent pas'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email: trimmedEmail,
            username,
            password: hashedPassword,
            provider: 'local',
            lastLogin: new Date()
        });

        await user.save();

        const token = generateToken({
            _id: user._id,
            email: user.email,
            mfaEnabled: true,
            is2FAVerified: false
        });

        // Créer un ActiveToken
        const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
        await ActiveToken.create({
            userId: user._id,
            token,
            deviceInfo,
            isValid: true
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'None'
        });

        req.flash('success', 'Compte créé avec succès');
        res.redirect('/blogs/my'); // Rediriger vers la page des blogs de l'utilisateur
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.render('auth/register', {
            error: 'Une erreur est survenue lors de l\'inscription'
        });
    }
};

const renderLogin = (req, res) => {
    res.render('auth/login', { error: null, success: req.flash('success') });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const newToken = generateToken({
                _id: user._id,
                email: user.email,
                mfaEnabled: user.mfaEnabled,
                is2FAVerified: !user.mfaEnabled
            });

            // Créer un nouveau ActiveToken
            const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
            await ActiveToken.create({
                userId: user._id,
                token: newToken,
                deviceInfo,
                isValid: true,
                lastUsed: new Date()
            });

            // Mise à jour du lastLogin
            await User.findByIdAndUpdate(user._id, {
                $set: { lastLogin: new Date() }
            });

            res.cookie('token', newToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'None'
            });

            if (user.mfaEnabled) {
                req.session.tempUserId = user._id;
                return res.redirect('/auth/2fa/verify');
            } else {
                return res.redirect('/blogs/my');
            }
        } else {
            res.render('auth/login', {
                error: 'Email ou mot de passe incorrect'
            });
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.render('auth/login', {
            error: 'Une erreur est survenue lors de la connexion'
        });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            // Invalider l'ActiveToken
            await ActiveToken.findOneAndUpdate(
                { token },
                {
                    isValid: false,
                    lastUsed: new Date()
                }
            );
        }
        res.clearCookie('token');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.clearCookie('token');
        res.redirect('/auth/login');
    }
};

// Nouvelles fonctions pour gérer les sessions actives à utiliser après l'implémentation des vues
// TODO implémentation des vues admin dashboard

// const renderActiveSessions = async (req, res) => {
//     try {
//         const activeSessions = await ActiveToken.find({
//             userId: req.user._id,
//             isValid: true
//         }).sort({ lastUsed: -1 });

//         res.render('auth/sessions', {
//             sessions: activeSessions,
//             currentToken: req.cookies.token
//         });
//     } catch (error) {
//         console.error('Erreur lors de la récupération des sessions:', error);
//         req.flash('error', 'Erreur lors de la récupération des sessions');
//         res.redirect('/blogs/my');
//     }
// };

// const revokeSession = async (req, res) => {
//     try {
//         const { sessionId } = req.params;
//         const token = await ActiveToken.findOne({
//             _id: sessionId,
//             userId: req.user._id
//         });

//         if (!token) {
//             return res.status(404).json({ error: 'Session non trouvée' });
//         }

//         await ActiveToken.findByIdAndUpdate(sessionId, {
//             isValid: false,
//             lastUsed: new Date()
//         });

//         // Si c'est la session courante, déconnecter l'utilisateur
//         if (token.token === req.cookies.token) {
//             res.clearCookie('token');
//             return res.json({ redirect: '/auth/login' });
//         }

//         res.json({ success: true });
//     } catch (error) {
//         console.error('Erreur lors de la révocation de la session:', error);
//         res.status(500).json({ error: 'Erreur lors de la révocation de la session' });
//     }
// };

// const revokeAllSessions = async (req, res) => {
//     try {
//         const currentToken = req.cookies.token;

//         await ActiveToken.updateMany(
//             {
//                 userId: req.user._id,
//                 token: { $ne: currentToken },
//                 isValid: true
//             },
//             {
//                 isValid: false,
//                 lastUsed: new Date()
//             }
//         );

//         res.json({ success: true });
//     } catch (error) {
//         console.error('Erreur lors de la révocation des sessions:', error);
//         res.status(500).json({ error: 'Erreur lors de la révocation des sessions' });
//     }
// };

module.exports = {
    renderRegister,
    register,
    renderLogin,
    login,
    logout,
    // renderActiveSessions,
    // revokeSession,
    // revokeAllSessions
};

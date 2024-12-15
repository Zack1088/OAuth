// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
    renderRegister,
    register,
    renderLogin,
    login,
    logout,
    // renderActiveSessions,
    // revokeSession,
    // revokeAllSessions
} = require('../controllers/auth.controller');
// const auth = require('../middleware/auth');
const passport = require('passport');

// Routes auth user
router.get('/register', renderRegister);
router.post('/register', register);
router.get('/login', renderLogin);
router.post('/login', login);
router.get('/logout', logout);

// Routes Google OAuth
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// Route de callback Google
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/login',
        failureFlash: true
    }),
    async (req, res) => {
        try {
            console.log('Google callback - checking user data');
           
            if (!req.user || !req.user.token) {
                console.error('No user or token found in callback');
                return res.redirect('/auth/login');
            }

            res.cookie('token', req.user.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            });

            // Sauvegarde dans la session
            req.session.token = req.user.token;
            await req.session.save();

            console.log('Cookie and session set successfully');
            res.redirect('/blogs/my');
        } catch (error) {
            console.error('Erreur lors de la connexion Google:', error);
            req.flash('error', 'Une erreur est survenue lors de la connexion');
            res.redirect('/auth/login');
        }
    }
);

// Route Discord OAuth
router.get('/discord',
    passport.authenticate('discord', {
        scope: ['identify', 'email']
    })
);

// Route de callback Discord
router.get('/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: '/auth/login',
        failureFlash: true
    }),
    async (req, res) => {
        try {
            console.log('Discord callback - checking user data');
           
            if (!req.user || !req.user.token) {
                console.error('No user or token found in Discord callback');
                return res.redirect('/auth/login');
            }

            res.cookie('token', req.user.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            });

            // Sauvegarde dans la session
            req.session.token = req.user.token;
            await req.session.save();

            console.log('Cookie and session set successfully');
            res.redirect('/blogs/my');
        } catch (error) {
            console.error('Erreur lors de la connexion Discord:', error);
            req.flash('error', 'Une erreur est survenue lors de la connexion');
            res.redirect('/auth/login');
        }
    }
);

//Routes admin dashboard
//TODO implémentation des vues admin dashboard
// router.get('/sessions', auth, renderActiveSessions);
// router.post('/sessions/:sessionId/revoke', auth, revokeSession);
// router.post('/sessions/revoke-all', auth, revokeAllSessions);

module.exports = router;
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy, 
refresh = require('passport-oauth2-refresh');
const User = require('../models/user.model');
const { generateToken } = require('../config/jwt');
const ActiveToken = require('../models/activeToken.model');

// Serialisation de l'utilisateur
passport.serializeUser((user, done) => {
    done(null, {
        id: user._id || user.id,
        token: user.token
    });
});

// Désérialisation de l'utilisateur
passport.deserializeUser(async (data, done) => {
    try {
        const user = await User.findById(data.id);
        if (user) {
            user.token = data.token;
        }
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Google Strategy avec ActiveToken
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['email', 'profile']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
            console.log('Updating token for existing Google user:', profile.emails?.[0]?.value);

            const jwtToken = generateToken({
                _id: user._id,
                email: user.email,
                provider: 'google',
                mfaEnabled: user.mfaEnabled,
                is2FAVerified: false
            });

            // ActiveToken
            const deviceInfo = `Google OAuth - ${profile.displayName}`;
            await ActiveToken.create({
                userId: user._id,
                token: jwtToken,
                deviceInfo,
                isValid: true,
                lastUsed: new Date()
            });

            // Mettre à jour les tokens d'accès et de rafraîchissement
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
            await user.save();

            const updatedUser = await User.findOneAndUpdate(
                { googleId: profile.id },
                { $set: { lastLogin: new Date() } },
                { new: true }
            );

            return done(null, { user: updatedUser, token: jwtToken });
        }

        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(null, false, { message: 'Email non fourni par Google' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return done(null, false, { message: 'Email déjà utilisé avec une autre méthode de connexion' });
        }

        const newUser = await User.create({
            email,
            googleId: profile.id,
            displayName: profile.displayName,
            username: profile.displayName?.replace(/\s+/g, '_').toLowerCase() || 
                      email.split('@')[0],
            provider: 'google',
            lastLogin: new Date(),
            accessToken,
            refreshToken
        });

        const jwtToken = generateToken({
            _id: newUser._id,
            email: newUser.email,
            provider: 'google',
            mfaEnabled: false,
            is2FAVerified: false
        });

        // ActiveToken
        await ActiveToken.create({
            userId: newUser._id,
            token: jwtToken,
            deviceInfo: `Google OAuth - ${profile.displayName}`,
            isValid: true,
            lastUsed: new Date()
        });

        return done(null, { user: newUser, token: jwtToken });
    } catch (error) {
        console.error('Erreur dans la stratégie Google:', error);
        return done(error);
    }
}));

// Stratégie Discord
const discordStrat = new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, callback) => {
    try {
        let user = await User.findOne({ discordId: profile.id });
        if (user) {
            console.log('Updating token for existing Discord user:', profile.email);

            const jwtToken = generateToken({
                _id: user._id,
                email: user.email,
                provider: 'discord',
                mfaEnabled: user.mfaEnabled,
                is2FAVerified: false
            });

            const deviceInfo = `Discord OAuth - ${profile.username}`;
            await ActiveToken.create({
                userId: user._id,
                token: jwtToken,
                deviceInfo,
                isValid: true,
                lastUsed: new Date()
            });

            // Mettre à jour les tokens d'accès et de rafraîchissement
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
            await user.save();

            const updatedUser = await User.findOneAndUpdate(
                { discordId: profile.id },
                { $set: { lastLogin: new Date() } },
                { new: true }
            );

            return callback(null, { user: updatedUser, token: jwtToken });
        }

        const existingUser = await User.findOne({ email: profile.email });
        if (existingUser) {
            return callback(null, false, { message: 'Email déjà utilisé avec une autre méthode de connexion' });
        }

        if (!profile.email) {
            console.error('Email not provided by Discord');
            return callback(null, { redirect: '/auth/discord/email', profile });
        }

        const newUser = await User.create({
            email: profile.email,
            discordId: profile.id,
            displayName: profile.username,
            username: profile.username?.replace(/\s+/g, '_').toLowerCase() || 
                      email.split('@')[0],
            provider: 'discord',
            lastLogin: new Date(),
            accessToken,
            refreshToken
        });

        const jwtToken = generateToken({
            _id: newUser._id,
            email: profile.email,
            provider: 'discord',
            mfaEnabled: false,
            is2FAVerified: false
        });

        await ActiveToken.create({
            userId: newUser._id,
            token: jwtToken,
            deviceInfo: `Discord OAuth - ${profile.username}`,
            isValid: true,
            lastUsed: new Date()
        });

        return callback(null, { user: newUser, token: jwtToken });
    } catch (error) {
        console.error('Error in Discord strategy:', error);
        return callback(error);
    }
});

passport.use(discordStrat);
refresh.use(discordStrat);

module.exports = passport;
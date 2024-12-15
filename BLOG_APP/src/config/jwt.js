// src/config/jwt.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

const generateToken = (userData) => {
    return jwt.sign(
        {
            _id: userData._id, 
            email: userData.email,
            provider: userData.provider, 
            mfaEnabled: userData.mfaEnabled || false,
            is2FAVerified: userData.is2FAVerified || false
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET
};
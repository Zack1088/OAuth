const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mfaController = require('../controllers/mfa.controller');

router.get('/setup', auth, mfaController.setupMfa);
router.post('/setup', auth, mfaController.validateMfa);
router.get('/verify', (req, res) => {
    if (!req.session.tempUserId) {
        return res.redirect('/auth/login');
    }
    res.render('auth/verify-2fa');
});
router.post('/verify', mfaController.verifyMfa);
router.post('/disable', auth, mfaController.disableMfa);
router.get('/manage', auth, mfaController.manageMfa);

module.exports = router;
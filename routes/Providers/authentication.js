/** Routes for healthcare providers/authentication */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../../config');

const healthcareProvider = require('../../models/HealthcareProviders');
const validatorSchema = require('../../middleware/validator');
const providerSignupSchema = require('../../schemas/providerSignup.json')
const providerLoginSchema = require('../../schemas/providerLogin.json')
const { createToken } = require('../../helpers/tokens');
const { authenticateJWT, ensureLoggedIn } = require('../../middleware/auth');
const HealthcareProviders = require('../../models/HealthcareProviders');



/**
 * POST /signup
 * Handle Provider signup form submission
 * Authorization required: none
 */
router.post('/signup', validatorSchema(providerSignupSchema), async function (req, res, next) {
    try {
        const { provider_type, name, email, password, bio, contact_information, address, phone, supported_health_issues } = req.body;
        // const newHealthcareProvider = await HealthcareProviders.register(req.body);
        const newProvider = await HealthcareProviders.register({
            name,
            email,
            password,
            provider_type,
            bio,
            contact_information,
            address,
            phone,
            supported_health_issues
        });
        const token = createToken(newProvider);
        return res.status(201).json({ token, provider: newProvider });
    } catch (err) {
        return next(err);
    }
});

/**
 * POST /login
 * Handle Providers login form submission
 * Authorization required: none
 */
router.post('/login', validatorSchema(providerLoginSchema), async function (req, res, next) {
    try {
        const { email, password } = req.body;
        const provider = await healthcareProvider.authenticate(email, password);
        if (provider) {
            const token = jwt.sign(
                {
                    healthcareprovider_id: provider.id,
                    isProvider: true
                },
                SECRET_KEY
            );
            return res.json({ token, id: provider.healthcareprovider_id });
        }
    } catch (err) {
        return next(err);
    }
});

/**
 * Logout route for Providers
 */
router.post('/logout', authenticateJWT, ensureLoggedIn, function (req, res) {
    // Handle Provider logout
    res.send('Logout functionality placeholder');
});

module.exports = router;
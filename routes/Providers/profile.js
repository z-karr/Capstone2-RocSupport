"use strict";

const express = require('express');
const router = express.Router();
const HealthcareProviders = require('../../models/HealthcareProviders');
const validatorSchema = require('../../middleware/validator');
const { authenticateJWT, ensureLoggedIn, ensureCorrectProvider } = require('../../middleware/auth');
const providerProfileSchema = require('../../schemas/providerProfile.json')
const providerProfileUpdateSchema = require('../../schemas/providerUpdate.json')

/**
 * GET /profile/:healthcareprovider_id - Get provider profile
 */
router.get('/profile/:healthcareprovider_id', authenticateJWT, ensureLoggedIn, ensureCorrectProvider, validatorSchema(providerProfileSchema), async function (req, res, next) 
{
    console.log('Requesting profile for provider ID:', req.params.healthcareprovider_id);
        try {
            const provider = await HealthcareProviders.getProviderById(req.params.healthcareprovider_id);
            return res.json({ provider });
        } catch (err) {
            return next(err);
        }
    }
);

// PATCH /profile/:healthcareprovider_id - Update provider profile
router.patch('/profile/:healthcareprovider_id', authenticateJWT, ensureLoggedIn, ensureCorrectProvider, validatorSchema(providerProfileUpdateSchema), async function (req, res, next) {
    try {
        const provider = await HealthcareProviders.update(req.params.healthcareprovider_id, req.body);
        return res.json({ provider });
    } catch (err) {
        return next(err);
    }
});

// DELETE /profile/:healthcareprovider_id - Delete provider profile
router.delete('/profile/:healthcareprovider_id', authenticateJWT, ensureLoggedIn, ensureCorrectProvider, async function (req, res, next) {
    try {
        await HealthcareProviders.deleteHealthcareProviderById(req.params.healthcareprovider_id);
        return res.json({ message: "Provider deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;

// "use strict";

// const express = require('express');
// const router = express.Router();
// const healthcareProvider = require('../../models/HealthcareProviders');
// const validatorSchema = require('../../middleware/validator');
// const { authenticateJWT, ensureLoggedIn, ensureCorrectUserOrAdmin } = require('../../middleware/auth');
// const providerProfileSchema = require('../../schemas/providerProfile.json')
// const providerProfileUpdateSchema = require('../../schemas/providerUpdate.json')

// /** Replace :name with provider ID */

// /**
//  * GET /profile:name - Get provider profile
//  */
// router.get('/profile/:healthcareprovider_id', authenticateJWT, ensureLoggedIn, validatorSchema(providerProfileSchema), ensureCorrectUserOrAdmin, async function (req, res, next) {
//     try {
//         const provider = await healthcareProvider.get(req.params.user);
//         return res.json({ provider });
//     } catch (err) {
//         return next(err);
//     }
// });

// // PATCH /profile:name - Update provider profile
// router.patch('/profile/:healthcareprovider_id', authenticateJWT, ensureLoggedIn, ensureCorrectUserOrAdmin, validatorSchema(providerProfileUpdateSchema), async function (req, res, next) {
//     try {
//         const provider = await healthcareProvider.update(req.params.name, req.body);
//         return res.json({ provider });
//     } catch (err) {
//         return next(err);
//     }
// });

// // DELETE /profile:name - Delete provider profile
// router.delete('/profile/:healthcareprovider_id', authenticateJWT, ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
//     try {
//         await Provider.deleteHealtcareProviderById(req.params.healthcareProvider);
//         return res.json({ message: "Provider deleted" });
//     } catch (err) {
//         return next(err);
//     }
// });

// module.exports = router;

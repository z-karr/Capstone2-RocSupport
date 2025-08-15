"use strict";

const express = require("express");
const router = express.Router();
const HealthcareProviders = require("../../models/HealthcareProviders");
const validatorSchema = require("../../middleware/validator");
const providerSignupSchema = require("../../schemas/providerSignup.json");
const providerLoginSchema = require("../../schemas/providerLogin.json");
const { createToken } = require("../../helpers/tokens");
const { authenticateJWT, ensureLoggedIn } = require("../../middleware/auth");

/**
 * POST /signup
 * Handle Provider signup form submission
 * Authorization required: none
 */
router.post(
  "/signup",
  validatorSchema(providerSignupSchema),
  async function (req, res, next) {
    try {
      const newProvider = await HealthcareProviders.register(req.body);
      const token = createToken({
        user_id: newProvider.userId,
        provider_id: newProvider.providerId,
        type: "provider",
        email: newProvider.email,
      });
      return res.status(201).json({ token, provider: newProvider });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * POST /login
 * Handle Providers login form submission
 * Authorization required: none
 */
router.post(
  "/login",
  validatorSchema(providerLoginSchema),
  async function (req, res, next) {
    try {
      const { email, password } = req.body;
      const provider = await HealthcareProviders.authenticate(email, password);
      const token = createToken({
        user_id: provider.user_id,
        provider_id: provider.provider_id,
        type: "provider",
        email: provider.email,
      });
      return res.json({
        token,
        provider: {
          user_id: provider.user_id,
          provider_id: provider.provider_id,
          name: provider.name,
          email: provider.email,
          provider_type: provider.provider_type,
          bio: provider.bio,
          contact_information: provider.contact_information,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * Logout route for Providers
 */
router.post("/logout", authenticateJWT, ensureLoggedIn, function (req, res) {
  // Handle Provider logout
  res.send("Logout functionality placeholder");
});

module.exports = router;

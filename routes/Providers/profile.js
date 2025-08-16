"use strict";

const express = require("express");
const router = express.Router();
const HealthcareProviders = require("../../models/HealthcareProviders");
const validatorSchema = require("../../middleware/validator");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectProvider,
} = require("../../middleware/auth");
const providerProfileUpdateSchema = require("../../schemas/providerUpdate.json");

/**
 * GET /profile/:providerId - Get provider profile (public access)
 */
router.get(
  "/profile/:providerId",
  async function (req, res, next) {
    try {
      const provider = await HealthcareProviders.getProviderById(
        req.params.providerId
      );
      return res.json({ provider });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PATCH /profile/:provider_id - Update provider profile
 */
router.patch(
  "/profile/:providerId",
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectProvider,
  validatorSchema(providerProfileUpdateSchema),
  async function (req, res, next) {
    console.log(
      "PATCH /profile/:providerId called with providerId:",
      req.params.providerId
    );
    try {
      const provider = await HealthcareProviders.update(
        req.params.providerId,
        req.body
      );
      return res.json({ provider });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * DELETE /profile/:providerId - Delete provider profile
 */
router.delete(
  "/profile/:providerId",
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectProvider,
  async function (req, res, next) {
    try {
      await HealthcareProviders.deleteHealthcareProviderById(
        req.params.providerId
      );
      return res.json({ message: "Provider deleted" });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

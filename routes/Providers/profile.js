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
 * GET /profile/:provider_id - Get provider profile
 */
router.get(
  "/profile/:provider_id",
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectProvider,
  async function (req, res, next) {
    try {
      const provider = await HealthcareProviders.getProviderById(
        req.params.provider_id
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
 * DELETE /profile/:provider_id - Delete provider profile
 */
router.delete(
  "/profile/:provider_id",
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectProvider,
  async function (req, res, next) {
    try {
      await HealthcareProviders.deleteHealthcareProviderById(
        req.params.provider_id
      );
      return res.json({ message: "Provider deleted" });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();
const HealthcareProviders = require("../../models/HealthcareProviders");
const EmergencyResources = require("../../models/EmergencyResources");
const validatorSchema = require("../../middleware/validator");
const medicalIssuesSchema = require("../../schemas/medicalIssues.json");

/** GET /:  { } => { homepage }
 * Render homepage with search functionality.
 * Authorization required: none
 */
router.get("/", function (req, res) {
  res.send("Homepage placeholder");
});

/** POST /search: { issue_name } => { providers, emergencyResources }
 * Search for providers and emergency resources corresponding to input health issue.
 * Authorization required: none
 */
router.post(
  "/search",
  validatorSchema(medicalIssuesSchema),
  async function (req, res, next) {
    try {
      const { issue_name } = req.body;
      const providers = await HealthcareProviders.findByMedicalIssue(
        issue_name
      );
      const emergencyResources = await EmergencyResources.findByMedicalIssue(
        issue_name
      );
      return res.json({ providers, emergencyResources });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

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
      console.log("Search request received:", req.body);
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

/** POST /search/advanced: { filters } => { providers, emergencyResources }
 * Enhanced search for providers with location and other filters.
 * Authorization required: none
 */
router.post(
  "/search/advanced",
  async function (req, res, next) {
    try {
      console.log("Advanced search request received:", req.body);
      const filters = req.body;
      
      // Get providers with enhanced search
      const providers = await HealthcareProviders.searchWithFilters(filters);
      
      // Get emergency resources if issue_name is provided
      let emergencyResources = [];
      if (filters.issue_name) {
        emergencyResources = await EmergencyResources.findByMedicalIssue(
          filters.issue_name
        );
      }
      
      return res.json({ providers, emergencyResources });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

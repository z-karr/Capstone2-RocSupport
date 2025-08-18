"use strict";

const express = require("express");
const router = express.Router();
const { authenticateJWT, ensureLoggedIn } = require("../../middleware/auth");
const ProviderContacts = require("../../models/ProviderContacts");
const validatorSchema = require("../../middleware/validator");
const { UnauthorizedError } = require("../../expressError");

/** POST /contacts: { providerId, subject, message, preferredContactMethod, urgencyLevel } => { contact }
 * Create a new contact request to a provider.
 * Authorization required: logged in patient
 */
router.post("/", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const patient_id = res.locals.user.patient_id;
    const {
      providerId,
      subject,
      message,
      patientName,
      patientEmail,
      patientPhone,
      preferredContactMethod = 'email',
      urgencyLevel = 'normal'
    } = req.body;

    const contact = await ProviderContacts.create({
      patient_id,
      provider_id: providerId,
      subject,
      message,
      patient_name: patientName,
      patient_email: patientEmail,
      patient_phone: patientPhone,
      preferred_contact_method: preferredContactMethod,
      urgency_level: urgencyLevel
    });

    return res.status(201).json({ contact });
  } catch (err) {
    return next(err);
  }
});

/** GET /contacts => { contacts }
 * Get all contact requests made by the logged-in patient.
 * Authorization required: logged in patient
 */
router.get("/", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const patient_id = res.locals.user.patient_id;
    const contacts = await ProviderContacts.getByPatientId(patient_id);
    return res.json({ contacts });
  } catch (err) {
    return next(err);
  }
});

/** GET /contacts/:contactId => { contact }
 * Get details of a specific contact request.
 * Authorization required: logged in patient (must be the contact creator)
 */
router.get("/:contactId", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const contact_id = req.params.contactId;
    const patient_id = res.locals.user.patient_id;
    
    const contact = await ProviderContacts.getById(contact_id);
    
    // Ensure the patient can only view their own contact requests
    if (contact.patient_id !== patient_id) {
      throw new UnauthorizedError();
    }
    
    return res.json({ contact });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
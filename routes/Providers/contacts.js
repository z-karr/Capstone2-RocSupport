"use strict";

const express = require("express");
const router = express.Router();
const { authenticateJWT, ensureLoggedIn } = require("../../middleware/auth");
const ProviderContacts = require("../../models/ProviderContacts");
const { UnauthorizedError } = require("../../expressError");

/** GET /contacts => { contacts, stats }
 * Get all contact requests for the logged-in provider.
 * Authorization required: logged in provider
 */
router.get("/", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const provider_id = res.locals.user.provider_id;
    const contacts = await ProviderContacts.getByProviderId(provider_id);
    const stats = await ProviderContacts.getProviderStats(provider_id);
    
    return res.json({ contacts, stats });
  } catch (err) {
    return next(err);
  }
});

/** GET /contacts/:contactId => { contact }
 * Get details of a specific contact request.
 * Authorization required: logged in provider (must be the recipient)
 */
router.get("/:contactId", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const contact_id = req.params.contactId;
    const provider_id = res.locals.user.provider_id;
    
    const contact = await ProviderContacts.getById(contact_id);
    
    // Ensure the provider can only view their own contact requests
    if (contact.provider_id !== provider_id) {
      throw new UnauthorizedError();
    }
    
    return res.json({ contact });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /contacts/:contactId => { contact }
 * Update contact status or add provider response.
 * Authorization required: logged in provider (must be the recipient)
 */
router.patch("/:contactId", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const contact_id = req.params.contactId;
    const provider_id = res.locals.user.provider_id;
    const { status, provider_response, providerResponse } = req.body;
    
    // Verify this contact belongs to the provider
    const existingContact = await ProviderContacts.getById(contact_id);
    if (existingContact.provider_id !== provider_id) {
      throw new UnauthorizedError();
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    // Accept both field name formats for compatibility
    if (provider_response) updateData.provider_response = provider_response;
    if (providerResponse) updateData.provider_response = providerResponse;
    
    const contact = await ProviderContacts.update(contact_id, updateData);
    
    return res.json({ contact });
  } catch (err) {
    return next(err);
  }
});

/** GET /stats => { stats }
 * Get contact statistics for the logged-in provider.
 * Authorization required: logged in provider
 */
router.get("/stats", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const provider_id = res.locals.user.provider_id;
    const stats = await ProviderContacts.getProviderStats(provider_id);
    return res.json({ stats });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
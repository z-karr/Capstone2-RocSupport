"use strict";

const express = require("express");
const router = express.Router();
const { ensureLoggedIn } = require("../../middleware/auth");
const FavoritesContacts = require("../../models/FavoritesContacts");
const favoritesSchema = require("../../schemas/favorites.json");
const validatorSchema = require("../../middleware/validator");

/** POST /: { providerId } => { favorite }
 * Favorite a provider.
 * Authorization required: logged in
 */
router.post(
  "/",
  ensureLoggedIn,
  validatorSchema(favoritesSchema),
  async function (req, res, next) {
    try {
      const { providerId } = req.body;
      const patientId = res.locals.user.patient_id;
      const favorite = await FavoritesContacts.create({
        patient_id: patientId,
        provider_id: providerId,
      });
      return res.status(201).json({ favorite });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /:favoriteId => { message }
 * Unfavorite a provider.
 * Authorization required: logged in
 */
router.delete("/:favoriteId", ensureLoggedIn, async function (req, res, next) {
  try {
    const { favoriteId } = req.params;
    await FavoritesContacts.remove(favoriteId);
    return res.json({ message: "Provider removed from favorites" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

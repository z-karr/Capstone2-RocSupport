/** Routes for user FavoriteContacts */
"use strict";

const express = require('express');
const router = express.Router();
const { ensureLoggedIn } = require('../../middleware/auth');
const FavoritesContacts = require('../../models/FavoritesContacts');
const favoritesSchema = require('../../schemas/favorites.json');
const validatorSchema = require('../../middleware/validator');

/** POST /: { providerId } => { favorite }
 *
 * Favorite a provider.
 *
 * Authorization required: logged in
 */
router.post('/', ensureLoggedIn, validatorSchema(favoritesSchema), async function (req, res, next) {
    const { providerId } = req.body;
    const civilianUserId = res.locals.user.id;
    const favorite = await FavoritesContacts.create({ civilian_user_id: civilianUserId, provider_id: providerId });
    return res.status(201).json({ favorite });
});

/** DELETE /:favoriteId => { message }
 *
 * Unfavorite a provider. Remove them from favorites list(saved providers)
 *
 * Authorization required: logged in
 */
router.delete('/:favoriteId', ensureLoggedIn, validatorSchema(favoritesSchema), async function (req, res, next) {
    const { favoriteId } = req.params;
    await FavoritesContacts.remove(favoriteId);
    return res.json({ message: "Provider removed from favorites" });
});

module.exports = router;
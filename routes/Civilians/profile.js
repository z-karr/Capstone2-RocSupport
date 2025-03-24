/** Routes for civilian profiles */

"use strict";

const express = require('express');
const router = express.Router();
const { ensureLoggedIn, ensureCorrectUserOrAdmin } = require('../../middleware/auth');
const { validate } = require('jsonschema');
const profileUpdateSchema = require('../../schemas/userUpdate.json');
const User = require('../../models/Users');

/** GET /profile: { } => { user }
 *
 * Get the profile details of the logged-in user.
 *
 * Authorization required: logged in
 */
router.get('/profile/:id', ensureLoggedIn, async function (req, res, next) {
    try {
        console.log(req.params.id)
        const user = await User.get(req.params.id);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /profile: { user } => { user }
 *
 * Update profile details of the logged-in user.
 *
 * Authorization required: logged in, correct user
 */
router.patch('/profile:', ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const validationResult = validate(req.body, profileUpdateSchema);
        if (!validationResult.valid) {
            const errors = validationResult.errors.map(error => error.stack);
            throw new BadRequestError(errors);
        }

        const user = await User.update(res.locals.user.username, req.body);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;

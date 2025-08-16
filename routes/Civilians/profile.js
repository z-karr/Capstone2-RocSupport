"use strict";

const express = require("express");
const router = express.Router();
const {
  ensureLoggedIn,
  authenticateJWT,
} = require("../../middleware/auth");
const validatorSchema = require("../../middleware/validator");
const profileUpdateSchema = require("../../schemas/userUpdate.json");
const User = require("../../models/Users");

/** GET /profile/:id => { user }
 * Get the profile details of the user by user_id.
 * Authorization required: logged in
 */
router.get("/profile/:id", authenticateJWT, ensureLoggedIn, async function (req, res, next) {
  try {
    const user = await User.get(req.params.id); // Should use user_id or patient_id
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /profile/:id: { user } => { user }
 * Update profile details of the logged-in user.
 * Authorization required: logged in, correct user
 */
router.patch(
  "/profile/:id",
  authenticateJWT,
  ensureLoggedIn,
  validatorSchema(profileUpdateSchema),
  async function (req, res, next) {
    try {
      const user = await User.update(req.params.id, req.body); // Should use user_id or patient_id
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

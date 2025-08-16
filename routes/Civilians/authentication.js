"use strict";

const express = require("express");
const router = express.Router();
const userSignupSchema = require("../../schemas/userSignup.json");
const userLoginSchema = require("../../schemas/userLogin.json");
const User = require("../../models/Users");
const { createToken } = require("../../helpers/tokens");
const validatorSchema = require("../../middleware/validator");

/** POST /signup: { user } => { token, user }
 * user must include { username, email, password, bio, address, phone }
 * Returns JWT token and user info.
 */
router.post(
  "/signup",
  validatorSchema(userSignupSchema),
  async function (req, res, next) {
    try {
      const newUser = await User.register(req.body);
      const token = createToken({
        user_id: newUser.userId,
        type: "patient",
        patient_id: newUser.patientId,
        email: newUser.email,
      });
      return res.status(201).json({ 
        token, 
        user: {
          userId: newUser.userId,
          patientId: newUser.patientId,
          name: newUser.name,
          email: newUser.email,
        }
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /login: { email, password } => { token, user }
 * Returns JWT token and user info.
 */
router.post(
  "/login",
  validatorSchema(userLoginSchema),
  async function (req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.authenticate(email, password);
      const token = createToken({
        user_id: user.user_id,
        type: "patient",
        patient_id: user.patient_id,
        email: user.email,
      });
      return res.json({
        token,
        user: {
          user_id: user.user_id,
          patient_id: user.patient_id,
          username: user.username,
          email: user.email,
          bio: user.bio,
          addressID: user.addressID,
          phoneID: user.phoneID,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

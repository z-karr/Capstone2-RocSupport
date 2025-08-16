"use strict";

const express = require("express");
const router = express.Router();
const Auth = require("../models/Auth");
const validatorSchema = require("../middleware/validator");
const loginSchema = require("../schemas/login.json");
const { createToken } = require("../helpers/tokens");

/**
 * POST /login
 * Unified login for all user types (patients and providers)
 * Authorization required: none
 */
router.post(
  "/login",
  validatorSchema(loginSchema),
  async function (req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await Auth.authenticate(email, password);
      
      const token = createToken({
        user_id: user.user_id,
        type: user.type,
        email: user.email,
        ...(user.type === 'patient' && { patient_id: user.patient_id }),
        ...(user.type === 'provider' && { provider_id: user.provider_id })
      });

      return res.json({
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          type: user.type,
          navigation_id: user.navigation_id,
          ...(user.type === 'patient' && { 
            patient_id: user.patient_id
          }),
          ...(user.type === 'provider' && { 
            provider_id: user.provider_id,
            provider_type: user.provider_type,
            bio: user.bio,
            contact_information: user.contact_information
          })
        }
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
"use strict";

const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");

class Auth {
  /** Unified authentication method for all user types
   * 
   * Authenticates against MasterUsers table, then fetches type-specific data
   * Returns user data with type and relevant IDs for navigation
   */
  static async authenticate(email, password) {
    try {
      // First, authenticate against MasterUsers table
      const masterUserResult = await db.query(
        `SELECT user_id, email, password, name, type
         FROM masterusers
         WHERE email = $1`,
        [email]
      );

      const masterUser = masterUserResult.rows[0];

      if (!masterUser) {
        throw new UnauthorizedError("Invalid email or password");
      }

      // Verify password
      const isValid = await bcrypt.compare(password, masterUser.password);
      if (!isValid) {
        throw new UnauthorizedError("Invalid email or password");
      }

      // Remove password from response
      delete masterUser.password;

      // Fetch type-specific data based on user type
      if (masterUser.type === 'patient') {
        const patientResult = await db.query(
          `SELECT P.patient_id
           FROM patients P
           WHERE P.user_id = $1`,
          [masterUser.user_id]
        );

        const patient = patientResult.rows[0];
        if (!patient) {
          throw new NotFoundError(`Patient record not found for user ${masterUser.user_id}`);
        }

        return {
          ...masterUser,
          patient_id: patient.patient_id,
          navigation_id: patient.patient_id
        };

      } else if (masterUser.type === 'provider') {
        const providerResult = await db.query(
          `SELECT HP.provider_id, HP.provider_type, HP.bio, HP.contact_information
           FROM healthcareproviders HP
           WHERE HP.user_id = $1`,
          [masterUser.user_id]
        );

        const provider = providerResult.rows[0];
        if (!provider) {
          throw new NotFoundError(`Provider record not found for user ${masterUser.user_id}`);
        }

        return {
          ...masterUser,
          provider_id: provider.provider_id,
          provider_type: provider.provider_type,
          bio: provider.bio,
          contact_information: provider.contact_information,
          navigation_id: provider.provider_id
        };

      } else {
        throw new BadRequestError(`Invalid user type: ${masterUser.type}`);
      }

    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }
}

module.exports = Auth;
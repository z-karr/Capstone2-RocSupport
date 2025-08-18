"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for managing FavoritesContacts */

class FavoritesContacts {
  /** Create a favorite contact (favorite_id will be auto-generated)
   *
   * data should be { civilian_user_id, provider_id }
   *
   * Returns { favorite_id, civilian_user_id, provider_id }
   **/
  static async create({ patient_id, provider_id }) {
    const result = await db.query(
      `INSERT INTO FavoritesContacts (patient_id, provider_id)
            VALUES ($1, $2)
            RETURNING favorite_id, patient_id, provider_id`,
      [patient_id, provider_id]
    );
    const favoriteContact = result.rows[0];

    return favoriteContact;
  }

  /** Find all favorite contacts for a patient
   *
   * Returns [{ favorite_id, patient_id, provider_id, provider_name, provider_type, bio, contact_information, ... }, ...]
   **/
  static async findAllByPatientId(patient_id) {
    const result = await db.query(
      `SELECT fc.favorite_id, fc.patient_id, fc.provider_id,
              hp.name, hp.provider_type, hp.bio, hp.contact_information,
              a.street_address, a.apartment_number, a.city, a.state, a.postal_code,
              p.country_code, p.area_code, p.phone_number, p.phone_type,
              ARRAY_AGG(mi.issue_name) as supported_health_issues
       FROM FavoritesContacts fc
       INNER JOIN HealthcareProviders hp ON fc.provider_id = hp.provider_id
       INNER JOIN MasterUsers mu ON hp.user_id = mu.user_id
       LEFT JOIN Addresses a ON hp.addressID = a.address_id
       LEFT JOIN PhoneNumbers p ON hp.phoneID = p.phone_id
       LEFT JOIN ProviderSupportedIssues psi ON hp.provider_id = psi.provider_id
       LEFT JOIN MedicalIssues mi ON psi.issue_id = mi.issue_id
       WHERE fc.patient_id = $1
       GROUP BY fc.favorite_id, fc.patient_id, fc.provider_id, hp.name, hp.provider_type, 
                hp.bio, hp.contact_information, a.street_address, a.apartment_number, 
                a.city, a.state, a.postal_code, p.country_code, p.area_code, 
                p.phone_number, p.phone_type
       ORDER BY fc.favorite_id`,
      [patient_id]
    );

    return result.rows;
  }

  /** Delete a favorite contact from the database.
   *
   * Returns { deleted: favorite_id }
   **/
  static async remove(favorite_id) {
    const result = await db.query(
      `DELETE
             FROM FavoritesContacts
             WHERE favorite_id = $1
             RETURNING favorite_id`,
      [favorite_id]
    );
    const deletedFavorite = result.rows[0];

    if (!deletedFavorite)
      throw new NotFoundError(
        `No favorite contact found with id: ${favorite_id}`
      );

    return { deleted: deletedFavorite.favorite_id };
  }
}

module.exports = FavoritesContacts;

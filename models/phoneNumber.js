"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for managing PhoneNumbers */

class PhoneNumbers {
  /** Create a new PhoneNumber (from data), update db, return new PhoneNumber data.
   *
   * Data should be { country_code, area_code, phone_number, phone_type }
   *
   * Returns { phone_id, country_code, area_code, phone_number, phone_type }
   *
   * Throws BadRequestError if PhoneNumber already exists in the database.
   */
  static async create({ country_code, area_code, phone_number, phone_type }) {
    // Validate required fields
    if (!country_code || !area_code || !phone_number) {
      throw new BadRequestError(
        "Country code, area code, and phone number are required."
      );
    }

    // Check for duplicate phone number
    const duplicateCheck = await db.query(
      `SELECT phone_id
             FROM PhoneNumbers
             WHERE country_code = $1 AND area_code = $2 AND phone_number = $3`,
      [country_code, area_code, phone_number]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError("Phone number already exists.");
    }

    // Insert the phone number into the database
    const result = await db.query(
      `INSERT INTO PhoneNumbers (country_code, area_code, phone_number, phone_type)
             VALUES ($1, $2, $3, $4)
             RETURNING phone_id, country_code, area_code, phone_number, phone_type`,
      [country_code, area_code, phone_number, phone_type]
    );

    return result.rows[0];
  }

  /** Retrieve a phone number by ID.
   *
   * Returns { phone_id, country_code, area_code, phone_number, phone_type }
   *
   * Throws NotFoundError if the phone number is not found.
   */
  static async getPhoneNumberById(phone_id) {
    const result = await db.query(
      `SELECT phone_id, country_code, area_code, phone_number, phone_type
             FROM PhoneNumbers
             WHERE phone_id = $1`,
      [phone_id]
    );

    const phoneNumber = result.rows[0];

    if (!phoneNumber) {
      throw new NotFoundError(`Phone number not found with ID: ${phone_id}`);
    }

    return phoneNumber;
  }

  /** Update a phone number by ID.
   *
   * Data should be { country_code, area_code, phone_number, phone_type }
   *
   * Returns { phone_id, country_code, area_code, phone_number, phone_type }
   *
   * Throws NotFoundError if the phone number is not found.
   */
  static async updatePhoneNumberById(
    phone_id,
    { country_code, area_code, phone_number, phone_type }
  ) {
    // Validate required fields
    if (!country_code || !area_code || !phone_number) {
      throw new BadRequestError(
        "Country code, area code, and phone number are required."
      );
    }

    const result = await db.query(
      `UPDATE PhoneNumbers
             SET country_code = $1,
                 area_code = $2,
                 phone_number = $3,
                 phone_type = $4
             WHERE phone_id = $5
             RETURNING phone_id, country_code, area_code, phone_number, phone_type`,
      [country_code, area_code, phone_number, phone_type, phone_id]
    );

    const updatedPhoneNumber = result.rows[0];

    if (!updatedPhoneNumber) {
      throw new NotFoundError(`Phone number not found with ID: ${phone_id}`);
    }

    return updatedPhoneNumber;
  }

  /** Delete a phone number by ID.
   *
   * Returns the ID of the deleted phone number.
   *
   * Throws NotFoundError if the phone number is not found.
   */
  static async deletePhoneNumberById(phone_id) {
    const result = await db.query(
      `DELETE FROM PhoneNumbers
             WHERE phone_id = $1
             RETURNING phone_id`,
      [phone_id]
    );

    const deletedPhoneId = result.rows[0]?.phone_id;

    if (!deletedPhoneId) {
      throw new NotFoundError(`Phone number not found with ID: ${phone_id}`);
    }

    return deletedPhoneId;
  }
}

module.exports = PhoneNumbers;

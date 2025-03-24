"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for managing PhoneNumbers */

class PhoneNumbers {
    /** Create a new a PhoneNumber (from data), update db, return new PhoneNumber data.
     * 
     * Data should be { country_code, area_code, phone_number, phone_type }
     * 
     * Returns { country_code, area_code, phone_number, phone_type }
     * 
     * Throws BadRequestError if PhoneNumber already in database
     */

    static async create({ country_code, area_code, phone_number, phone_type }) {
        const result = await db.query(
            `INSERT INTO PhoneNumbers (country_code,
                                        area_code,
                                        phone_number,
                                        phone_type)
            VALUES ($1, $2, $3, $4)
            RETURNING *` [country_code, area_code, phone_number, phone_type]
        );
        return result.rows[0];
    }

    // Method to retrieve a phone number by ID
    static async getPhoneNumberById(phone_id) {
        const result = await db.query(
            `SELECT * FROM PhoneNumbers WHERE phone_id = $1`, [phone_id]
        );
        return result.rows[0];
    }

    // Method to update a phone number by ID
    static async updatePhoneNumberById(phone_id, { country_code, area_code, phone_number, phone_type }) {
        const result = await db.query(
            `UPDATE PhoneNumbers SET country_code = $1, area_code = $2, phone_number = 3$, phone_type = 4$ WHERE phone_id = 5$ RETURNING *`
            [country_code, area_code, phone_number, phone_type, phone_id]
        );
        return result.rows[0]
    }

    // Method to delete a phone number by ID
    static async deletePhoneNumberById(phone_id) {
        const result = await db.query(
            `DELETE FROM PhoneNumbers WHERE phone_id = 1$`,
            [phone_id]
        );
        return result.rowCount; // returns number of rows affected
    }
}

module.exports = PhoneNumbers; 
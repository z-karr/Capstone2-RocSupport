"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for managing Addresses */

class Addresses {
    /** Create and insert an address into the database.
     * 
     * This function will insert the provided address object into
     * the addresses table.
     * If the address already exists, it will throw a BadRequestError.
     * 
     * Returns the newly inserted address object.
     */
    static async create({ street_address, apartment_number, city, state, postal_code }) {
        // Check if the address already exists
        const duplicateCheck = await db.query(
            `SELECT *
            FROM addresses
            WHERE street_address = $1
                AND apartment_number = $2
                AND city = $3
                AND state = $4
                AND postal_code = $5`,
            [street_address, apartment_number, city, state, postal_code],
        );

        // If address already exists, throw a BadRequestError
        if (duplicateCheck.rows[0]) {
            const existingAddress = duplicateCheck.rows[0];
            throw new BadRequestError(`Address already exists: ${JSON.stringify(existingAddress)}`);
        }

        // Insert the address into the addresses table
        const result = await db.query(
            `INSERT INTO addresses (
                street_address,
                apartment_number,
                city,
                state,
                postal_code
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [street_address, apartment_number, city, state, postal_code],
        );

        const address = result.rows[0];

        return address;
    }

    /** Get an address by its ID.
     * 
     * Returns the address data from the addresses table, by its ID.
     * If the address does not exist in the database, it throws a BadRequestError.
     * 
     * Returns the address object.
     */
    static async getAddressById(address_id) {
        const result = await db.query(
            `SELECT address_id,
            street_address,
            apartment_number,
            city,
            state,
            postal_code
        FROM addresses
        WHERE address_id = $1`,
            [address_id]
        );

        const address = result.rows[0];

        if (!address) {
            throw new NotFoundError(`Address not found with ID: ${address_id}`);
        }

        return address;
    }

    /** Update an existing address by its ID
     * 
     * Returns the updated address data
     * 
     * Throws NotFoundError if the address with the given ID is not found.
     */
    static async updateAddress(address_id, newData) {
        // Check if the address exists
        await Addresses.getAddressById(address_id);

        // Construct the SQL query for updating the address
        const { street_address, apartment_number, city, state, postal_code } = newData;
        const result = await db.query(
            `UPDATE addresses
        SET street address = $1,
            apartment_number = $2,
            city = $3,
            state = $4,
            postal_code = $5
        WHERE address_id = $6
        RETURNING address_id`,
            [street_address, apartment_number, city, state, postal_code, address_id],
        );
        return result.rows[0]
    }

    /** Delete an address by its ID
     * 
     * Returns true if the address was successfully deleted.
     * 
     * Throws NotFoundError if the address with the given ID is not found
     */
    static async deleteAddress(address_id) {
        // Check if the address exists
        await Addresses.getAddressById(address_id);

        // Delete the address
        const result = await db.query(
            `DELETE FROM addresses
        WHERE address_id = $1`,
            [address_id],
        );

        return result.rowCount > 0; // Returns Boolean val True or False whether or not address was deleted (True)
    }


}

module.exports = Addresses;

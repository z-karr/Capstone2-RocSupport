// ****** register(), how do I address and phone with this

"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config");

/** Related functions for managing Users */

class Users {
  /** Authenticate user with email, password.
   *
   * Returns { email }
   *
   * Throws UnauthorizedError if user is not found or wrong password.
   */
  static async authenticate(email, password) {
    // Try to find the user first
    const result = await db.query(
      `select MU.user_id, MU.password, MU.email
            FROM patients
            INNER JOIN masterusers as MU ON MU.user_id = patients.user_id
            WHERE MU.email = $1  AND MU.type = 'patient'`,
      [email]
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid email/password");
  }

  /** Register user with data
   *
   * Returns user, consisting of { username, email, type, bio, addressID, phoneID }
   *
   * Throws BadRequestError if user is a duplicate/already exists
   */
  static async register({ username, email, password, type, bio, address, phone }) {
    const duplicateCheck = await db.query(
      `SELECT email
             FROM MasterUsers
             WHERE email = $1`,
      [email]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate email: ${email}`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    // Initialize variables to store the IDs of inserted address and phone records
    let addressID, phoneID;

    // Insert addresss into addresses table and retrieve the inserted addresses's ID
    const addressRes = await db.query(
      `INSERT INTO addresses (
                street_address,
                apartment_number,
                city,
                state,
                postal_code
            ) VALUES ($1, $2, $3, $4, $5) RETURNING address_id`,
      [
        address.street_address,
        address.apartment_number,
        address.city,
        address.state,
        address.postal_code,
      ]
    );
    addressID = addressRes.rows[0].address_id;

    // Insert the phone number into the phone_numbers table and retrieve the inserted phone number's ID
    const phoneRes = await db.query(
      `INSERT INTO phonenumbers (
                country_code,
                area_code,
                phone_number,
                phone_type
            ) VALUES ($1, $2, $3, $4) RETURNING phone_id`,
      [
        phone.country_code,
        phone.area_code,
        phone.phone_number,
        phone.phone_type,
      ]
    );
    phoneID = phoneRes.rows[0].phone_id;

    // Insert the user record into the MasterUsers table, including the address and phone IDs
    const result = await db.query(
      `INSERT INTO masterusers (
                name, 
                email, 
                password,  
                type
                )
            VALUES ($1, $2, $3, $4) RETURNING *`,
      [username, email, hashedPassword, type]
    );
    user_id = result.rows[0].user_id;
    const patientResult = await db.query(
      `INSERT INTO patients (
                user_id,
                bio,
                addressid,
                phoneid,
                )
            VALUES ($1, $2, $3, $4) RETURNING *`,
        
      [user_id, bio, addressID, phoneID]
    );
    const user = patientResult.rows[0];

    // Return the newly inserted user record
    return user;
  }

  /** Retrieve user information by user_id.
   *
   * Returns the user object containing username, email, and isAdmin fields.
   *
   * Throws notFoundError if no user is found with given username
   */
  static async getUserById(user_id) {
    // Query the database to retrieve user information by username
    const userRes = await db.query(
      `SELECT username,
                email
            FROM users
            WHERE user_id = $1`,
      [username]
    );

    // Extract the first row from the query result
    const user = userRes.rows[0];

    // If no user is found, throw a NotFoundError
    if (!user)
      throw new NotFoundError(`No user found with User Id: ${user_id}`);

    // Return the user object
    return user;
  }

  /** Update user information in the database.
   *
   * This function allows for partial updates, meaning it only updates fields provided in the data object.
   *
   * Supports updating the user's email, password, address, and phone number.
   *
   * If address or phone data is provided, it inserts or updates them in their respective tables.
   *
   * The function also updates the username if provided.
   *
   * Throws BadRequestError if no fiels are provided for update or if no user is found with the provided username
   */
  static async updateByUserId(user_id, data) {
    // Extracting data fields from the data object
    const { email, password, addressID, phoneID } = data;

    // Validate that at least one field is being updated
    if (!data) {
      throw new BadRequestError("No fields to update");
    }

    // Generate SQL SET clause for partial updates
    // sqlForPartialUpdate() imported at script top
    const { setCols: userSetCols, values: userValues } = sqlForPartialUpdate(
      { email, password },
      {
        email: "email",
        password: "password",
      }
    );

    // Check if address data is provided for updating
    if (data.address) {
      // Destructure address fields
      const { street_address, apartment_number, city, state, postal_code } =
        data.address;
      // Insert or update address in the database
      const addressRes = await db.query(
        `INSERT INTO addresses (
                    street_address,
                    apartment_number,
                    city,
                    state,
                    postal_code
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (street_address, city, state, postal_code) DO NOTHING
                RETURNING address_id`,
        [street_address, apartment_number, city, state, postal_code]
      );
      // Get the addressID
      addressID = addressRes.rows[0].address_id;
    }

    // Check if phone data is provided for updating
    if (data.phone) {
      // Destructure phone fields
      const { country_code, area_code, phone_number, phone_type } = data.phone;
      // Insert or update phoe number in the database
      const phoneRes = await db.query(
        `INSERT INTO phone_nubers (
                    country_code,
                    area_code,
                    phone_number,
                    phone_type
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (phone_number) DO NOTHING
                RETURNING phone_id`,
        [country_code, area_code, phone_number, phone_type]
      );
      // Get the phoneID
      phoneID = phoneRes.rows[0].phone_id;
    }

    // Generate SQL SET clause for address and phone updates
    const addressSetCols = addressID
      ? `"addressID"=$${userValues.lengthn + 1}`
      : "";
    const phoneSetCols = phoneID
      ? `"phoneID"=$${userValues.length + (addressID ? 2 : 1)}`
      : "";

    // Generate SQL SET clause for updating username
    const usernameSetCol = username
      ? `"username"=$${
          userValues.length +
          (addressID && phoneID ? 3 : addressID || phoneID ? 2 : 1)
        }`
      : "";

    // Combine all SET clauses
    const setCols = [userSetCols, addressSetCols, phoneSetCols, usernameSetCol]
      .filter(Boolean)
      .join(", ");

    // Prepare values for the query
    const values = [...userValues];
    if (addressID) values.push(addressID);
    if (phoneID) values.push(phoneID);
    if (username) values.push(username);

    // Construct the SQL query for updating the user
    const query = `
            UPDATE Users
            SET ${setCols},
                updated_at = NOW()
            WHERE username = $${values.length + 1}
            RETURNING *`;

    // Execute the query and retrieve the updated user
    const result = await db.query(query, [...values, username]);
    const user = result.rows[0];

    // Throw error if no user is found with the provided username
    if (!user)
      throw new BadRequestError(`No user found with username ${username}`);

    return user;
  }

  /** Method to remove a user by username */
  static async remove(username) {
    // Remove user from the database
    const result = await db.query(`DELETE FROM Users WHERE username = $1`, [
      username,
    ]);

    // Check if the user was successfully removed. If successfully removed, rowCount would be > 0
    if (result.rowCount === 0) {
      // If no user was found with the provided username, throw a BadRequestError
      throw new BadRequestError(`No user found with username: ${username}`);
    }

    return result.rowCount > 0; // returns Boolean val True or False whether or not user was deleted (True)
  }
}

module.exports = Users;

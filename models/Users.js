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
   * Returns user, consisting of { name, email, addressID, phoneID }
   *
   * Throws BadRequestError if user is a duplicate/already exists
   */
  static async register({ name, email, password, address, phone }) {
    try {
      await db.query("BEGIN");

      const duplicateCheck = await db.query(
        `SELECT email
               FROM masterusers
               WHERE email = $1`,
        [email]
      );

      if (duplicateCheck.rows[0]) {
        throw new BadRequestError(`Duplicate email: ${email}`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

      // Insert address into addresses table and retrieve the inserted address's ID
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
          address.apartment_number || null,
          address.city,
          address.state,
          address.postal_code,
        ]
      );
      const addressID = addressRes.rows[0].address_id;

      // Insert the phone number into the phonenumbers table and retrieve the inserted phone number's ID
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
      const phoneID = phoneRes.rows[0].phone_id;

      // Insert into masterusers table
      const masterUserResult = await db.query(
        `INSERT INTO masterusers (
                  name, 
                  email, 
                  password,  
                  type
                  )
              VALUES ($1, $2, $3, 'patient') RETURNING user_id`,
        [name, email, hashedPassword]
      );
      const user_id = masterUserResult.rows[0].user_id;
      console.log("Inserted user_id:", user_id);

      // Insert into patients table
      const patientResult = await db.query(
        `INSERT INTO patients (
                  user_id,
                  addressid,
                  phoneid
                  )
              VALUES ($1, $2, $3) RETURNING patient_id`,
        [user_id, addressID, phoneID]
      );
      const patient_id = patientResult.rows[0].patient_id;
      console.log("Inserted patient_id:", patient_id);

      await db.query("COMMIT");

      // Return the newly inserted user record
      return {
        userId: user_id,
        patientId: patient_id,
        name,
        email,
      };
    } catch (e) {
      await db.query("ROLLBACK");
      console.error("Error in patient register method:", e);
      throw e;
    }
  }

  /** Retrieve patient by patient_id with full profile data */
  static async get(patient_id) {
    try {
      const patientResult = await db.query(
        `SELECT P.patient_id, MU.name, MU.email,
                A.address_id, A.street_address, A.apartment_number, A.city, A.state, A.postal_code,
                PN.phone_id, PN.country_code, PN.area_code, PN.phone_number, PN.phone_type
         FROM patients P
         INNER JOIN masterusers MU ON P.user_id = MU.user_id
         LEFT JOIN addresses A ON P.addressID = A.address_id
         LEFT JOIN phonenumbers PN ON P.phoneID = PN.phone_id
         WHERE P.patient_id = $1`,
        [patient_id]
      );

      if (patientResult.rows.length === 0) {
        throw new NotFoundError(`No patient found with id: ${patient_id}`);
      }

      const patient = patientResult.rows[0];

      // Structure the patient data to match frontend expectations
      const patientData = {
        patient_id: patient.patient_id,
        username: patient.name, // Frontend expects 'username' field
        name: patient.name,
        email: patient.email,
        address: {
          address_id: patient.address_id,
          street_address: patient.street_address,
          apartment_number: patient.apartment_number,
          city: patient.city,
          state: patient.state,
          postal_code: patient.postal_code,
        },
        phone: {
          phone_id: patient.phone_id,
          country_code: patient.country_code,
          area_code: patient.area_code,
          phone_number: patient.phone_number,
          phone_type: patient.phone_type,
        },
      };

      return patientData;
    } catch (e) {
      console.error("Error in get patient method:", e);
      throw e;
    }
  }

  static async update(patient_id, data) {
    try {
      await db.query("BEGIN");

      // 1. Get user_id for this patient_id
      const patientRes = await db.query(
        `SELECT user_id FROM patients WHERE patient_id = $1`,
        [patient_id]
      );
      const patientRow = patientRes.rows[0];
      if (!patientRow)
        throw new NotFoundError(`No patient found with ID: ${patient_id}`);
      const user_id = patientRow.user_id;

      // 2. Split data into masterusers and patients fields
      const masterusersFields = {};
      const patientsFields = {};

      // Separate fields for masterusers and patients  
      const masterusersAllowed = ["name", "email"];
      const patientsAllowed = []; // No patient-specific fields for simple use case

      for (const key of Object.keys(data)) {
        if (masterusersAllowed.includes(key)) {
          masterusersFields[key] = data[key];
        } else if (patientsAllowed.includes(key)) {
          patientsFields[key] = data[key];
        }
      }

      // 3. Update masterusers if needed
      if (Object.keys(masterusersFields).length > 0) {
        const { setCols, values } = sqlForPartialUpdate(masterusersFields, {});
        const userIdVarIdx = "$" + (values.length + 1);
        await db.query(
          `UPDATE masterusers SET ${setCols} WHERE user_id = ${userIdVarIdx}`,
          [...values, user_id]
        );
      }

      // 4. Update patients if needed
      if (Object.keys(patientsFields).length > 0) {
        const { setCols, values } = sqlForPartialUpdate(patientsFields, {});
        const patientIdVarIdx = "$" + (values.length + 1);
        await db.query(
          `UPDATE patients SET ${setCols} WHERE patient_id = ${patientIdVarIdx}`,
          [...values, patient_id]
        );
      }

      // 5. Update address if provided
      if (data.address && Object.keys(data.address).length > 0) {
        // Get the current address ID for this patient
        const currentPatientResult = await db.query(
          `SELECT addressID FROM patients WHERE patient_id = $1`,
          [patient_id]
        );
        const addressId = currentPatientResult.rows[0]?.addressid;
        
        if (addressId) {
          // Filter out address_id from the update data
          const addressData = { ...data.address };
          delete addressData.address_id;
          
          const addressFields = Object.keys(addressData).filter(key => 
            ['street_address', 'apartment_number', 'city', 'state', 'postal_code'].includes(key)
          );
          
          if (addressFields.length > 0) {
            const addressUpdateData = {};
            addressFields.forEach(field => {
              addressUpdateData[field] = addressData[field];
            });
            
            const { setCols, values } = sqlForPartialUpdate(addressUpdateData, {});
            const addressIdVarIdx = "$" + (values.length + 1);
            await db.query(
              `UPDATE addresses SET ${setCols} WHERE address_id = ${addressIdVarIdx}`,
              [...values, addressId]
            );
          }
        }
      }

      // 6. Update phone if provided
      if (data.phone && Object.keys(data.phone).length > 0) {
        // Get the current phone ID for this patient
        const currentPatientResult = await db.query(
          `SELECT phoneID FROM patients WHERE patient_id = $1`,
          [patient_id]
        );
        const phoneId = currentPatientResult.rows[0]?.phoneid;
        
        if (phoneId) {
          // Filter out phone_id from the update data
          const phoneData = { ...data.phone };
          delete phoneData.phone_id;
          
          const phoneFields = Object.keys(phoneData).filter(key => 
            ['country_code', 'area_code', 'phone_number', 'phone_type'].includes(key)
          );
          
          if (phoneFields.length > 0) {
            const phoneUpdateData = {};
            phoneFields.forEach(field => {
              phoneUpdateData[field] = phoneData[field];
            });
            
            const { setCols, values } = sqlForPartialUpdate(phoneUpdateData, {});
            const phoneIdVarIdx = "$" + (values.length + 1);
            await db.query(
              `UPDATE phonenumbers SET ${setCols} WHERE phone_id = ${phoneIdVarIdx}`,
              [...values, phoneId]
            );
          }
        }
      }

      await db.query("COMMIT");

      // Fetch and return the updated patient information
      return await Users.get(patient_id);
    } catch (e) {
      await db.query("ROLLBACK");
      console.error("Error in patient update method:", e);
      throw e;
    }
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

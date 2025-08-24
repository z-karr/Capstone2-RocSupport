"use strict";

const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");

class HealthcareProviders {
  /** Create new healthcare provider
   * - We use a transaction to make sure the process os atomic.
   *     - if one part fails it is all rolled back
   */
  static async register({
    provider_type,
    name,
    email,
    password,
    bio,
    contact_information,
    address,
    phone,
    supported_health_issues,
  }) {
    try {
      await db.query("BEGIN");

      // Check for duplicate provider
      const duplicateCheck = await db.query(
        `SELECT email
                 FROM masterusers
                 WHERE email = $1`,
        [email]
      );

      if (duplicateCheck.rows[0]) {
        throw new BadRequestError(`Duplicate email: ${email}`);
      }

      // Hash Provider password
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

      // Insert address
      const addressResult = await db.query(
        `INSERT INTO addresses (street_address, apartment_number, city, state, postal_code)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING address_id`,
        [
          address.street_address,
          address.apartment_number || null,
          address.city,
          address.state,
          address.postal_code,
        ]
      );
      const addressID = addressResult.rows[0].address_id;

      // Insert phone
      const phoneResult = await db.query(
        `INSERT INTO phonenumbers (country_code, area_code, phone_number, phone_type)
                 VALUES ($1, $2, $3, $4)
                 RETURNING phone_id`,
        [
          phone.country_code,
          phone.area_code,
          phone.phone_number,
          phone.phone_type,
        ]
      );
      const phoneID = phoneResult.rows[0].phone_id;

      // Insert into masterusers table
      const masterUserResult = await db.query(
        `INSERT INTO masterusers (name, email, password, type)
                 VALUES ($1, $2, $3, 'provider')
                 RETURNING user_id`,
        [name, email, hashedPassword]
      );
      const userId = masterUserResult.rows[0].user_id;
      console.log("Inserted user_id:", userId);

      // Insert into healthcareproviders table
      const providerResult = await db.query(
        `INSERT INTO HealthcareProviders (user_id, provider_type, bio, contact_information, addressID, phoneID)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING provider_id`,
        [
          userId,
          provider_type,
          bio || null,
          contact_information || null,
          addressID,
          phoneID,
        ]
      );

      const providerId = providerResult.rows[0].provider_id;
      console.log("Inserted provider_id:", providerId);

      if (supported_health_issues && supported_health_issues.length > 0) {
        // Look up issue IDs for each issue name
        const issueIds = await Promise.all(
          supported_health_issues.map(async (issueName) => {
            const result = await db.query(
              `SELECT issue_id FROM MedicalIssues WHERE LOWER(issue_name) = LOWER($1)`,
              [issueName.trim()]
            );
            if (result.rows.length === 0) {
              throw new BadRequestError(`Health issue not found: ${issueName}`);
            }
            return result.rows[0].issue_id;
          })
        );

        // Insert into ProviderSupportedIssues
        await Promise.all(
          issueIds.map((issueId) =>
            db.query(
              `INSERT INTO ProviderSupportedIssues (provider_id, issue_id)
               VALUES ($1, $2)`,
              [providerId, issueId]
            )
          )
        );

        console.log(
          "Inserted ProviderSupportedIssues for provider_id:",
          providerId
        );
      }

      await db.query("COMMIT");

      return {
        userId,
        providerId,
        name,
        email,
        provider_type,
        bio,
        contact_information,
      };
    } catch (e) {
      await db.query("ROLLBACK");
      console.error("Error in register method:", e);
      throw e;
    }
  }

  /** Authenticate Healthcare Provider with email, password.
   *
   * Throws UnauthorizedError if user is not found or wrong password.
   */
  static async authenticate(email, password) {
    // Try to find the user first
    const result = await db.query(
      `SELECT MU.user_id, MU.password, MU.email, MU.name, HP.provider_id, HP.provider_type, HP.bio, HP.contact_information
             FROM masterusers MU
             INNER JOIN healthcareproviders HP ON MU.user_id = HP.user_id
             WHERE MU.email = $1 AND MU.type = 'provider'`,
      [email]
    );

    const provider = result.rows[0];

    if (provider) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, provider.password);
      if (isValid) {
        delete provider.password;
        return provider;
      }
    }

    throw new UnauthorizedError("Invalid email or password");
  }

  /** Retrieve all healthcare providers */
  static async getAllHealthcareProviders() {
    const providerRes = await db.query(
      `SELECT HP.provider_id, MU.name, MU.email, HP.provider_type, HP.bio, HP.contact_information
             FROM HealthcareProviders HP
             INNER JOIN MasterUsers MU ON HP.user_id = MU.user_id`
    );
    return providerRes.rows;
  }

  /** Retrieve a healthcare provider by Id */
  static async getProviderById(provider_id) {
    try {
      const providerResult = await db.query(
        `SELECT HP.provider_id, MU.name, MU.email, HP.provider_type, HP.bio, HP.contact_information,
                A.address_id, A.street_address, A.apartment_number, A.city, A.state, A.postal_code,
                P.phone_id, P.country_code, P.area_code, P.phone_number, P.phone_type
         FROM HealthcareProviders HP
         INNER JOIN MasterUsers MU ON HP.user_id = MU.user_id
         LEFT JOIN Addresses A ON HP.addressID = A.address_id
         LEFT JOIN PhoneNumbers P ON HP.phoneID = P.phone_id
         WHERE HP.provider_id = $1`,
        [provider_id]
      );

      if (providerResult.rows.length === 0) {
        throw new NotFoundError(`No provider found with id: ${provider_id}`);
      }

      const provider = providerResult.rows[0];

      // Fetch supported health issues
      const issuesResult = await db.query(
        `SELECT MI.issue_name
             FROM providersupportedissues PSI
                INNER JOIN medicalissues MI ON PSI.issue_id = MI.issue_id
             WHERE PSI.provider_id = $1`,
        [provider_id]
      );

      // Structure the provider data
      const providerData = {
        provider_id: provider.provider_id,
        name: provider.name,
        email: provider.email,
        provider_type: provider.provider_type,
        bio: provider.bio,
        contact_information: provider.contact_information,
        address: {
          address_id: provider.address_id,
          street_address: provider.street_address,
          apartment_number: provider.apartment_number,
          city: provider.city,
          state: provider.state,
          postal_code: provider.postal_code,
        },
        phone: {
          phone_id: provider.phone_id,
          country_code: provider.country_code,
          area_code: provider.area_code,
          phone_number: provider.phone_number,
          phone_type: provider.phone_type,
        },
        supported_health_issues: issuesResult.rows.map((row) => row.issue_name),
      };

      return providerData;
    } catch (e) {
      console.error("Error in getProviderById method:", e);
      throw e;
    }
  }

  /** Retrieve all healthcare providers by a specific supported medical issue ID */
  static async getHealthcareProviderByIssueID(issue_id) {
    const res = await db.query(
      `SELECT HP.provider_id, MU.name, MU.email, HP.provider_type, HP.bio, HP.contact_information,
              A.street_address, A.apartment_number, A.city, A.state, A.postal_code,
              P.country_code, P.area_code, P.phone_number, P.phone_type,
              ARRAY_AGG(MI.issue_name) as supported_health_issues
         FROM ProviderSupportedIssues PSI
         INNER JOIN HealthcareProviders HP ON PSI.provider_id = HP.provider_id
         INNER JOIN MasterUsers MU ON HP.user_id = MU.user_id
         LEFT JOIN Addresses A ON HP.addressID = A.address_id
         LEFT JOIN PhoneNumbers P ON HP.phoneID = P.phone_id
         LEFT JOIN ProviderSupportedIssues PSI2 ON HP.provider_id = PSI2.provider_id
         LEFT JOIN MedicalIssues MI ON PSI2.issue_id = MI.issue_id
         WHERE PSI.issue_id = $1
         GROUP BY HP.provider_id, MU.name, MU.email, HP.provider_type, HP.bio, HP.contact_information,
                  A.street_address, A.apartment_number, A.city, A.state, A.postal_code,
                  P.country_code, P.area_code, P.phone_number, P.phone_type`,
      [issue_id]
    );

    const providers = res.rows;
    if (providers.length === 0) {
      throw new NotFoundError(
        `No healthcare providers found with issue ID: ${issue_id}`
      );
    }

    return providers;
  }

  /** Retrieve all healthcare providers by a specific supported medical issue name */
  static async findByMedicalIssue(issue) {
    const issueRes = await db.query(
      `SELECT issue_id
         FROM MedicalIssues
         WHERE issue_name ILIKE $1`,
      [`%${issue}%`]
    );

    const issueRow = issueRes.rows[0];
    if (!issueRow) {
      throw new NotFoundError(`No medical issue found with name: ${issue}`);
    }

    const issue_id = issueRow.issue_id;

    return this.getHealthcareProviderByIssueID(issue_id);
  }

  /** Enhanced search with filters for providers 
   * @param {Object} filters - Search filters
   * @param {string} filters.issue_name - Medical issue to search for
   * @param {string} filters.city - City to filter by
   * @param {string} filters.state - State to filter by (defaults to NY for Rochester area)
   * @param {string} filters.provider_type - Type of provider to filter by
   * @param {string} filters.postal_code - ZIP code to filter by
   */
  static async searchWithFilters(filters = {}) {
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Base query
    let query = `
      SELECT DISTINCT HP.provider_id, MU.name, MU.email, HP.provider_type, HP.bio, HP.contact_information,
             A.street_address, A.apartment_number, A.city, A.state, A.postal_code,
             P.country_code, P.area_code, P.phone_number, P.phone_type,
             ARRAY_AGG(DISTINCT MI.issue_name) as supported_health_issues
      FROM HealthcareProviders HP
      INNER JOIN MasterUsers MU ON HP.user_id = MU.user_id
      LEFT JOIN Addresses A ON HP.addressID = A.address_id
      LEFT JOIN PhoneNumbers P ON HP.phoneID = P.phone_id
      LEFT JOIN ProviderSupportedIssues PSI ON HP.provider_id = PSI.provider_id
      LEFT JOIN MedicalIssues MI ON PSI.issue_id = MI.issue_id
    `;

    // Add medical issue filter
    if (filters.issue_name) {
      whereConditions.push(`MI.issue_name ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.issue_name}%`);
      paramIndex++;
    }

    // Add location filters
    if (filters.city) {
      whereConditions.push(`A.city ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.city}%`);
      paramIndex++;
    }

    if (filters.state) {
      whereConditions.push(`A.state = $${paramIndex}`);
      queryParams.push(filters.state);
      paramIndex++;
    } else {
      // Default to NY for Rochester area focus
      whereConditions.push(`A.state = $${paramIndex}`);
      queryParams.push('NY');
      paramIndex++;
    }

    if (filters.postal_code) {
      whereConditions.push(`A.postal_code = $${paramIndex}`);
      queryParams.push(filters.postal_code);
      paramIndex++;
    }

    // Add provider type filter
    if (filters.provider_type) {
      whereConditions.push(`HP.provider_type ILIKE $${paramIndex}`);
      queryParams.push(`%${filters.provider_type}%`);
      paramIndex++;
    }

    // Add WHERE clause if we have conditions
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add GROUP BY and ORDER BY
    query += `
      GROUP BY HP.provider_id, MU.name, MU.email, HP.provider_type, HP.bio, HP.contact_information,
               A.street_address, A.apartment_number, A.city, A.state, A.postal_code,
               P.country_code, P.area_code, P.phone_number, P.phone_type
      ORDER BY A.city, MU.name
    `;

    const res = await db.query(query, queryParams);
    return res.rows;
  }

  static async update(provider_id, data) {
    try {
      await db.query("BEGIN");

      // 1. Get user_id for this provider_id
      const providerRes = await db.query(
        `SELECT user_id FROM HealthcareProviders WHERE provider_id = $1`,
        [provider_id]
      );
      const providerRow = providerRes.rows[0];
      if (!providerRow)
        throw new NotFoundError(`No provider found with ID: ${provider_id}`);
      const user_id = providerRow.user_id;

      // 2. Split data into masterusers and healthcareproviders fields
      const masterusersFields = {};
      const healthcareprovidersFields = {};

      // Separate fields for masterusers and healthcareproviders
      const masterusersAllowed = ["name", "email"];
      const healthcareprovidersAllowed = [
        "provider_type",
        "bio",
        "contact_information",
      ];

      for (const key of Object.keys(data)) {
        if (masterusersAllowed.includes(key)) {
          masterusersFields[key] = data[key];
        } else if (healthcareprovidersAllowed.includes(key)) {
          healthcareprovidersFields[key] = data[key];
        }
      }
      // Add more healthcareproviders fields if needed

      // 3. Update masterusers if needed
      if (Object.keys(masterusersFields).length > 0) {
        const { setCols, values } = sqlForPartialUpdate(masterusersFields, {});
        const userIdVarIdx = "$" + (values.length + 1);
        await db.query(
          `UPDATE masterusers SET ${setCols} WHERE user_id = ${userIdVarIdx}`,
          [...values, user_id]
        );
      }

      // 4. Update healthcareproviders if needed
      if (Object.keys(healthcareprovidersFields).length > 0) {
        const { setCols, values } = sqlForPartialUpdate(
          healthcareprovidersFields,
          {}
        );
        const providerIdVarIdx = "$" + (values.length + 1);
        await db.query(
          `UPDATE HealthcareProviders SET ${setCols} WHERE provider_id = ${providerIdVarIdx}`,
          [...values, provider_id]
        );
      }

      // 5. Update address if provided
      if (data.address && Object.keys(data.address).length > 0) {
        // Get the current address ID for this provider
        const currentProviderResult = await db.query(
          `SELECT addressID FROM HealthcareProviders WHERE provider_id = $1`,
          [provider_id]
        );
        const addressId = currentProviderResult.rows[0]?.addressid;
        
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
              `UPDATE Addresses SET ${setCols} WHERE address_id = ${addressIdVarIdx}`,
              [...values, addressId]
            );
          }
        }
      }

      // 6. Update phone if provided
      if (data.phone && Object.keys(data.phone).length > 0) {
        // Get the current phone ID for this provider
        const currentProviderResult = await db.query(
          `SELECT phoneID FROM HealthcareProviders WHERE provider_id = $1`,
          [provider_id]
        );
        const phoneId = currentProviderResult.rows[0]?.phoneid;
        
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
              `UPDATE PhoneNumbers SET ${setCols} WHERE phone_id = ${phoneIdVarIdx}`,
              [...values, phoneId]
            );
          }
        }
      }

      // 7. Update supported health issues if provided
      if (
        data.supported_health_issues &&
        data.supported_health_issues.length > 0
      ) {
        await db.query(
          `DELETE FROM ProviderSupportedIssues WHERE provider_id = $1`,
          [provider_id]
        );

        const issueIds = await Promise.all(
          data.supported_health_issues.map(async (issue) => {
            const issueResult = await db.query(
              `SELECT issue_id FROM MedicalIssues WHERE LOWER(issue_name) = LOWER($1)`,
              [issue.trim()]
            );
            if (issueResult.rows.length === 0) {
              throw new BadRequestError(`Health issue not found: ${issue}`);
            }
            return issueResult.rows[0].issue_id;
          })
        );

        await Promise.all(
          issueIds.map((issueId) =>
            db.query(
              `INSERT INTO ProviderSupportedIssues (provider_id, issue_id)
             VALUES ($1, $2)`,
              [provider_id, issueId]
            )
          )
        );
      }

      await db.query("COMMIT");

      // Fetch and return the updated provider information
      return await HealthcareProviders.getProviderById(provider_id);
    } catch (e) {
      await db.query("ROLLBACK");
      console.error("Error in update method:", e);
      throw e;
    }
  }

  /** Delete a healthcare provider by ID */
  static async deleteHealthcareProviderById(provider_id) {
    console.log("calling deleteHealthcareProviderById");
    const result = await db.query(
      `DELETE FROM HealthcareProviders
         WHERE provider_id = $1
         RETURNING provider_id`,
      [provider_id]
    );

    const deletedProviderId = result.rows[0].provider_id;
    if (!deletedProviderId) {
      throw new NotFoundError(`No provider found with ID: ${provider_id}`);
    }

    return deletedProviderId;
  }
}

module.exports = HealthcareProviders;

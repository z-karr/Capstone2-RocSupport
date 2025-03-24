"use strict";

const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config")
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
    BadRequestError,
    NotFoundError
} = require("../expressError");


class HealthcareProviders {

    /** Create new healthcare provider
     * - We use a transaction to make sure the process os atomic.
     *     - if one part fails it is all rolled back
     */
    static async register({ provider_type, name, email, password, bio, contact_information, address, phone, supported_health_issues }) {
        try {
            await db.query('BEGIN');

            // Check for duplicate provider
            const duplicateCheck = await db.query(
                `SELECT name, email
                 FROM HealthcareProviders
                 WHERE name = $1 OR email = $2`,
                [name, email]
            );

            if (duplicateCheck.rows[0]) {
                throw new BadRequestError(`Duplicate name or email: ${name}, ${email}`);
            }

            // Hash Provider password
            const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

            // Insert address
            const addressResult = await db.query(
                `INSERT INTO addresses (street_address, apartment_number, city, state, postal_code)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING address_id`,
                [address.street_address, address.apartment_number || null, address.city, address.state, address.postal_code]
            );
            const addressID = addressResult.rows[0].address_id;

            // Insert phone
            const phoneResult = await db.query(
                `INSERT INTO phonenumbers (country_code, area_code, phone_number, phone_type)
                 VALUES ($1, $2, $3, $4)
                 RETURNING phone_id`,
                [phone.country_code, phone.area_code, phone.phone_number, phone.phone_type]
            );
            const phoneID = phoneResult.rows[0].phone_id;

            // Insert the new healthcare provider
            const providerResult = await db.query(
                `INSERT INTO HealthcareProviders (
                    provider_type, name, email, password, bio, contact_information, addressID, phoneID
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING healthcareprovider_id`,
                [provider_type, name, email, hashedPassword, bio || null, contact_information || null, addressID, phoneID]
            );

            const healthcareProviderId = providerResult.rows[0].healthcareprovider_id;

            console.log("Inserted HealthcareProvider_id:", healthcareProviderId);
            console.log("HealthcareProvider_id before processing health issues:", healthcareProviderId)
            // if (!healthcareProviderId) {
            //     throw new Error("Failed to retrieve HealthcareProvider_id after insertion");
            // }

            // Handle supported health issues
            if (supported_health_issues && supported_health_issues.length > 0) {
                for (let issue of supported_health_issues) {
                    const issueResult = await db.query(
                        `SELECT issue_id FROM MedicalIssues WHERE LOWER(issue_name) = LOWER($1)`,
                        [issue.trim()]
                    );

                    if (issueResult.rows.length === 0) {
                        throw new BadRequestError(`Health issue not found: ${issue}`);
                    }

                    const issueId = issueResult.rows[0].issue_id;

                    const supportedIssueResult = await db.query(
                        `INSERT INTO ProviderSupportedIssues (provider_id, issue_id) VALUES ($1, $2) RETURNING *`,
                        [healthcareProviderId, issueId]
                    );

                    console.log("Inserted ProviderSupportedIssue:", supportedIssueResult.rows[0]);
                }
            }

            await db.query('COMMIT');

            return {
                // HealthcareProvider_id: healthcareProviderId,
                name,
                email,
                provider_type,
                bio,
                contact_information
            };

        } catch (e) {
            await db.query('ROLLBACK');
            console.error("Error in register method:", e);
            throw e;
        }
    }

    /** Authenticate Healthcare Provider with username, password.
         * 
         * Throws UnauthorizedError if user is not found or wrong password.
         */
    static async authenticate(email, password) {
        // Try to find the user first
        const result = await db.query(
            `SELECT 
                    healthcareprovider_id,
                    email,
                    password
            FROM healthcareproviders
            WHERE email = $1`,
            [email]
        );

        const provider = result.rows[0];

        if (provider) {
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(password, provider.password);
            if (isValid === true) {
                delete provider.password;
                return provider;
            }
        }

        throw new UnauthorizedError("Invalid email or password");
    }

    /** Retrieve all healthcare providers */
    static async getAllHealthcareProviders() {
        const providerRes = await db.query(
            `SELECT * FROM healthcareproviders`
        );
        return providerRes.rows;
    }

    /** Retrieve a healthcare provider by Id */
    static async getProviderById(healthcareprovider_id) {
        try {
            const providerResult = await db.query(
                `SELECT hp.healthcareprovider_id, hp.name, hp.email, hp.provider_type, hp.bio, hp.contact_information,
                        a.address_id, a.street_address, a.apartment_number, a.city, a.state, a.postal_code,
                        p.phone_id, p.country_code, p.area_code, p.phone_number, p.phone_type
                 FROM HealthcareProviders hp
                 LEFT JOIN Addresses a ON hp.addressID = a.address_id
                 LEFT JOIN PhoneNumbers p ON hp.phoneID = p.phone_id
                 WHERE hp.healthcareprovider_id = $1`,
                [healthcareprovider_id]
            );

            if (providerResult.rows.length === 0) {
                throw new NotFoundError(`No provider found with id: ${healthcareprovider_id}`);
            }

            const provider = providerResult.rows[0];

            // Fetch supported health issues
            const issuesResult = await db.query(
                `SELECT mi.issue_name
                 FROM ProviderSupportedIssues psi
                 JOIN MedicalIssues mi ON psi.issue_id = mi.issue_id
                 WHERE psi.provider_id = $1`,
                [healthcareprovider_id]
            );

            // Structure the provider data
            const providerData = {
                healthcareprovider_id: provider.healthcareprovider_id,
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
                    postal_code: provider.postal_code
                },
                phone: {
                    phone_id: provider.phone_id,
                    country_code: provider.country_code,
                    area_code: provider.area_code,
                    phone_number: provider.phone_number,
                    phone_type: provider.phone_type
                },
                supported_health_issues: issuesResult.rows.map(row => row.issue_name)
            };

            return providerData;
        } catch (e) {
            console.error("Error in getProviderById method:", e);
            throw e;
        }
    }


    /** Retrieve all healthcare providers by a specific supported medical issue.
     * 
     * To be used in the 'return' of the next function, findByMedicalIssues(issue)
     * 
    */
    static async getHealthcareProviderByIssueID(supported_health_issuesID) {
        const res = await db.query(
            `SELECT * FROM healthcareproviders
            WHERE supported_health_issuesID = $1`,
            [supported_health_issuesID]
        );

        const providers = res.rows;
        if (providers.length === 0) throw new NotFoundError(`No healthcare providers found with supported health issue ID: ${supported_health_issuesID}`);

        return providers;
    }

    /** Retrieve all healthcare providers by a specific supported medical issue name on the /search route. 
     * 
     * This function will retrieve the medical issue from the MedicalIssues table, 
     * 
     * then utilize the above function to match it to the corresponding providers with supported_health_issueID.
     * 
     */
    static async findByMedicalIssue(issue) {
        const issueRes = await db.query(
            `SELECT issue_id
            FROM medicalissues
            WHERE issue_name ILIKE $1`,
            [`%${issue}%`]
        );

        const issueRow = issueRes.rows[0];
        if (!issueRow) throw new NotFoundError(`No medical issue found with name: ${issue}`);

        const supported_health_issuesID = issueRow.issue_id;

        return this.getHealthcareProviderByIssueID(supported_health_issuesID);
    }

    /** Update a healthcare provider by Id */
    static async update(healthcareprovider_id, data) {
        try {
            await db.query('BEGIN');

            // Update HealthcareProviders table
            const { setCols, values } = sqlForPartialUpdate(
                data,
                {
                    name: "name",
                    bio: "bio",
                    contact_information: "contact_information",
                    provider_type: "provider_type"
                }
            );
            const providerIdVarIdx = "$" + (values.length + 1);

            const querySql = `UPDATE HealthcareProviders 
                                  SET ${setCols} 
                                  WHERE healthcareprovider_id = ${providerIdVarIdx} 
                                  RETURNING *`;
            const result = await db.query(querySql, [...values, healthcareprovider_id]);
            const provider = result.rows[0];

            if (!provider) throw new NotFoundError(`No provider: ${healthcareprovider_id}`);

            // Update address if provided
            if (data.address) {
                const { setCols: addressSetCols, values: addressValues } = sqlForPartialUpdate(
                    data.address,
                    {
                        street_address: "street_address",
                        apartment_number: "apartment_number",
                        city: "city",
                        state: "state",
                        postal_code: "postal_code"
                    }
                );
                await db.query(
                    `UPDATE addresses
                         SET ${addressSetCols}
                         WHERE address_id = $${addressValues.length + 1}`,
                    [...addressValues, provider.addressid]
                );
            }

            // Update phone if provided
            if (data.phone) {
                const { setCols: phoneSetCols, values: phoneValues } = sqlForPartialUpdate(
                    data.phone,
                    {
                        country_code: "country_code",
                        area_code: "area_code",
                        phone_number: "phone_number",
                        phone_type: "phone_type"
                    }
                );
                await db.query(
                    `UPDATE phonenumbers
                         SET ${phoneSetCols}
                         WHERE phone_id = $${phoneValues.length + 1}`,
                    [...phoneValues, provider.phoneid]
                );
            }

            // Update supported health issues if provided
            if (data.supported_health_issues && data.supported_health_issues.length > 0) {
                // First, remove existing associations
                await db.query(
                    `DELETE FROM ProviderSupportedIssues WHERE provider_id = $1`,
                    [healthcareprovider_id]
                );

                // Then, add new associations
                for (let issue of data.supported_health_issues) {
                    const issueResult = await db.query(
                        `SELECT issue_id FROM MedicalIssues WHERE LOWER(issue_name) = LOWER($1)`,
                        [issue.trim()]
                    );

                    if (issueResult.rows.length === 0) {
                        throw new BadRequestError(`Health issue not found: ${issue}`);
                    }

                    const issueId = issueResult.rows[0].issue_id;

                    await db.query(
                        `INSERT INTO ProviderSupportedIssues (provider_id, issue_id) VALUES ($1, $2)`,
                        [healthcareprovider_id, issueId]
                    );
                }
            }

            await db.query('COMMIT');

            // Fetch and return the updated provider information
            return await HealthcareProviders.getProviderById(healthcareprovider_id);

        } catch (e) {
            await db.query('ROLLBACK');
            console.error("Error in update method:", e);
            throw e;
        }
    }



    /** Delete a healthcare provider by Id */
    static async deleteHealthcareProviderById(healthcareprovider_id) {
        const result = await db.query(
            `DELETE FROM healthcareproviders
            WHERE healthcareprovider_id = $1
            RETURNING healthcareprovider_id`,
            [healthcareprovider_id]
        );
        const deletedHealthcareProviderId = result.rows[0].healthcareprovider_id;
        if (!deletedHealthcareProviderId) throw new NotFoundError(`Healthcare provider not found with Id: ${healthcareprovider_id}`);

        return deletedHealthcareProviderId;
    }

}

module.exports = HealthcareProviders;
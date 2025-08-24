"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
    BadRequestError,
    NotFoundError
} = require("../expressError");

class EmergencyResources {
    /** Create a new emergency resource */
    static async create({ resource_name, phone_number, description }) {
        // Insert the new emergency resource into the EmergencyResources table
        const result = await db.query(
            `INSERT INTO emergencyresources (
                resource_name,
                phone_number,
                description
            ) VALUES ($1, $2, $3)
            RETURNING resource_id`,
            [resource_name, phone_number, description],
        );

        const newResourceId = result.rows[0].resource_id;
        return newResourceId;
    }

    /** Retrieve all emergency resources */
    static async getAll() {
        const resourcesRes = await db.query(
            `SELECT resource_id, resource_name, phone_number, description
             FROM emergencyresources`
        );
        return resourcesRes.rows;
    }

    /** Retrieve an emergency resource by ID */
    static async getById(resource_id) {
        const resourceRes = await db.query(
            `SELECT resource_id, resource_name, phone_number, description
             FROM emergencyresources
             WHERE resource_id = $1`,
            [resource_id]
        );

        const resource = resourceRes.rows[0];
        if (!resource) throw new NotFoundError(`Emergency resource not found with ID: ${resource_id}`);

        return resource;
    }

    /** Update an emergency resource by ID */
    static async update(resource_id, { resource_name, phone_number, description }) {
        // Generate SQL SET clause for partial updates
        const { setCols, values } = sqlForPartialUpdate({ resource_name, phone_number, description }, {
            resource_name: "resource_name",
            phone_number: "phone_number",
            description: "description"
        });

        // Prepare the SQL query
        const query = `
            UPDATE emergencyresources
            SET ${setCols}
            WHERE resource_id = $${values.length + 1}
            RETURNING resource_id`;

        // Execute the query
        const result = await db.query(query, [...values, resource_id]);
        const updatedResourceId = result.rows[0].resource_id;
        if (!updatedResourceId) throw new NotFoundError(`Emergency resource not found with ID: ${resource_id}`);

        return updatedResourceId;
    }

    /** Delete an emergency resource by ID */
    static async delete(resource_id) {
        const result = await db.query(
            `DELETE FROM emergencyresources
             WHERE resource_id = $1
             RETURNING resource_id`,
            [resource_id]
        );
        const deletedResourceId = result.rows[0].resource_id;
        if (!deletedResourceId) throw new NotFoundError(`Emergency resource not found with ID: ${resource_id}`);

        return deletedResourceId;
    }


    /** Retrieve all emergency resources by a specific supported medical issue ID
     * 
     * Returns corresponding resources for a given issue_id.
     * 
     * This function will be used in the next function to match the input issue name with the issue_id and its resources
    */
    static async getResourceByIssueID(issue_id) {
        const result = await db.query(
            `SELECT *
            FROM emergencyresources
            WHERE issue_id = $1`,
            [issue_id]
        );

        const resources = result.rows;
        return resources; // Return empty array if no resources found
    }

    /**Retrieve all emergency resources by a specific supported medical issue name.
     * 
     * We use the above function to match issue_id with the user-input issue name to retrieve its emergency resources.
     */
    static async findByMedicalIssue(issue) {
        const issueRes = await db.query(
            `SELECT issue_id
            FROM medicalissues
            WHERE issue_name ILIKE $1`,
            [`%${issue}%`]
        );

        const issueRow = issueRes.rows[0];
        if (!issueRow) return []; // Return empty array if medical issue not found

        const issue_id = issueRow.issue_id;

        return this.getResourceByIssueID(issue_id);
    }
}

module.exports = EmergencyResources;

"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError, NotFoundError } = require("../expressError");

class MedicalIssues {
  /** Create a new medical issue */
  static async create({ issue_name, description }) {
    // Check for duplicate issue_name
    const duplicateCheck = await db.query(
      `SELECT issue_id
             FROM medicalissues
             WHERE LOWER(issue_name) = LOWER($1)`,
      [issue_name]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate medical issue: ${issue_name}`);
    }

    // Insert the new medical issue into the MedicalIssues table
    const result = await db.query(
      `INSERT INTO medicalissues (
                issue_name,
                description
            ) VALUES ($1, $2)
            RETURNING issue_id, issue_name, description`,
      [issue_name, description]
    );

    // Return the new medical issue
    return result.rows[0];
  }

  /** Retrieve all medical issues */
  static async getAllMedicalIssues() {
    const medicalIssuesRes = await db.query(
      `SELECT issue_id, issue_name, description
             FROM medicalissues`
    );

    // Return all rows of data from query
    return medicalIssuesRes.rows;
  }

  /** Retrieve a medical issue by id */
  static async getMedicalIssueById(issue_id) {
    const issueRes = await db.query(
      `SELECT issue_id, issue_name, description
             FROM medicalissues
             WHERE issue_id = $1`,
      [issue_id]
    );

    // Return issue from query. If no issue, throw NotFoundError
    const issue = issueRes.rows[0];
    if (!issue)
      throw new NotFoundError(`Medical issue not found with Id: ${issue_id}`);

    return issue;
  }

  /** Retrieve all healthcare providers for a specific medical issue */
  static async getProvidersByIssueId(issue_id) {
    const providersRes = await db.query(
      `SELECT HP.provider_id, MU.name, MU.email, HP.provider_type, HP.bio, HP.contact_information
             FROM ProviderSupportedIssues PSI
             INNER JOIN HealthcareProviders HP ON PSI.provider_id = HP.provider_id
             INNER JOIN MasterUsers MU ON HP.user_id = MU.user_id
             WHERE PSI.issue_id = $1`,
      [issue_id]
    );

    const providers = providersRes.rows;
    if (providers.length === 0) {
      throw new NotFoundError(
        `No providers found for medical issue ID: ${issue_id}`
      );
    }

    return providers;
  }

  /** Update a medical issue by ID */
  static async update(issue_id, { issue_name, description }) {
    // Generate SQL SET clause for partial updates
    const { setCols, values } = sqlForPartialUpdate(
      { issue_name, description },
      {
        issue_name: "issue_name",
        description: "description",
      }
    );

    // Prepare the SQL query
    const query = `
            UPDATE medicalissues
            SET ${setCols}
            WHERE issue_id = $${values.length + 1}
            RETURNING issue_id, issue_name, description`;

    // Execute the query and return the updated issue
    const result = await db.query(query, [...values, issue_id]);
    const updatedIssue = result.rows[0];
    if (!updatedIssue)
      throw new NotFoundError(`Medical issue not found with Id: ${issue_id}`);

    return updatedIssue;
  }

  /** Delete a medical issue by Id */
  static async delete(issue_id) {
    const result = await db.query(
      `DELETE FROM medicalissues
             WHERE issue_id = $1
             RETURNING issue_id`,
      [issue_id]
    );

    // Return the id of the issue that was deleted
    const deletedIssueId = result.rows[0]?.issue_id;
    if (!deletedIssueId)
      throw new NotFoundError(`Medical issue not found with Id: ${issue_id}`);

    return deletedIssueId;
  }
}

module.exports = MedicalIssues;

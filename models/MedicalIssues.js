"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
    BadRequestError,
    NotFoundError
} = require("../expressError");

class MedicalIssues {
    /** Create a new medical issue */
    static async create({ issue_name, description }) {
        // Insert the new medical issue into the MedicalIssues table
        const result = await db.query(
            `INSERT INTO medicalissues (
                issue_name,
                description
            ) VALUES ($1, $2)
            RETURNING issue_id`,
            [issue_name, description],
        );

        // Return the new medical issue id for the created issue
        const newIssueId = result.rows[0].issue_id;
        return newIssueId;
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
        const medicalIssuesRes = await db.query(
            `SELECT issue_id, issue_name, description
            FROM medicalissues
            WHERE issue_id = $1`,
            [issue_id]
        );

        // Return issue from query. If no issue, throw NotFoundError
        const issue = issueRes.rows[0];
        if (!issue) throw new NotFoundError(`Medical issue not found with Id: ${issue_id}`);

        return issue;
    }

    /** Update a medical issue by ID */
    static async update(issue_id, { issue_name, description }) {
        // Genrate SQL SET clause for partial updates
        const { setCols, values } = sqlForPartialUpdate({ issue_name, description }, {
            issue_name: "issue_name",
            description: "description"
        });

        // Prepare the SQL auery
        const query = `
            UPDATE medicalissues
            SET ${setCols}
            WHERE issue_id = $${values.length + 1}
            RETURNING issue_id`;

        // Return the id of the issue that was updated
        const result = await db.query(query, [...values, issue_id]);
        const updatedIssueId = result.rows[0].issue_id;
        if (!updatedIssueId) throw new NotFoundError(`Medical issue not found with Id: ${issue_id}`);

        return updatedIssueId;
    }

    /** Delete a medical issue by Id */
    static async delete(issue_id) {
        const result = await db.query(
            `DELETE FROM medicalissues
            WHERE issue_id= = $1
            RETURNING issue_id`,
            [issue_id]
        );

        // Return the id of the issue that was deleted
        const deletedIssueId = result.rows[0].issue_id;
        if (!deletedIssueId) throw new NotFoundError(`Medical issue not found with Id: ${issue_id}`);

        return deletedIssueId;
    }

}

module.exports = MedicalIssues;
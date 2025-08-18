"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for managing Provider Contacts/Messages */

class ProviderContacts {
  /** Create a new contact request from patient to provider
   *
   * data should be { 
   *   patient_id, 
   *   provider_id, 
   *   subject, 
   *   message, 
   *   patient_name, 
   *   patient_email, 
   *   patient_phone, 
   *   preferred_contact_method, 
   *   urgency_level 
   * }
   *
   * Returns { contact_id, patient_id, provider_id, subject, message, status, created_at }
   **/
  static async create({
    patient_id,
    provider_id,
    subject,
    message,
    patient_name,
    patient_email,
    patient_phone,
    preferred_contact_method = 'email',
    urgency_level = 'normal'
  }) {
    const result = await db.query(
      `INSERT INTO ProviderContacts 
       (patient_id, provider_id, subject, message, patient_name, patient_email, 
        patient_phone, preferred_contact_method, urgency_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING contact_id, patient_id, provider_id, subject, message, 
                 patient_name, patient_email, status, created_at`,
      [
        patient_id,
        provider_id,
        subject,
        message,
        patient_name,
        patient_email,
        patient_phone,
        preferred_contact_method,
        urgency_level
      ]
    );

    const contact = result.rows[0];
    return contact;
  }

  /** Get all contact requests for a specific provider
   *
   * Returns [{ contact_id, patient_id, provider_id, subject, message, 
   *           patient_name, patient_email, patient_phone, preferred_contact_method,
   *           urgency_level, status, created_at, updated_at }, ...]
   **/
  static async getByProviderId(provider_id) {
    const result = await db.query(
      `SELECT contact_id, patient_id, provider_id, subject, message,
              patient_name, patient_email, patient_phone, preferred_contact_method,
              urgency_level, status, provider_response, created_at, updated_at, responded_at
       FROM ProviderContacts
       WHERE provider_id = $1
       ORDER BY 
         CASE 
           WHEN urgency_level = 'urgent' THEN 1
           WHEN urgency_level = 'normal' THEN 2
           WHEN urgency_level = 'low' THEN 3
         END,
         created_at DESC`,
      [provider_id]
    );

    return result.rows;
  }

  /** Get all contact requests made by a specific patient
   *
   * Returns [{ contact_id, provider_id, provider_name, subject, message, 
   *           status, created_at, updated_at }, ...]
   **/
  static async getByPatientId(patient_id) {
    const result = await db.query(
      `SELECT pc.contact_id, pc.provider_id, mu.name as provider_name, 
              pc.subject, pc.message, pc.patient_name, pc.patient_email, pc.patient_phone,
              pc.preferred_contact_method, pc.urgency_level, pc.status, pc.provider_response,
              pc.created_at, pc.updated_at, pc.responded_at
       FROM ProviderContacts pc
       INNER JOIN HealthcareProviders hp ON pc.provider_id = hp.provider_id
       INNER JOIN MasterUsers mu ON hp.user_id = mu.user_id
       WHERE pc.patient_id = $1
       ORDER BY pc.created_at DESC`,
      [patient_id]
    );

    return result.rows;
  }

  /** Get a specific contact request by ID
   *
   * Returns { contact_id, patient_id, provider_id, subject, message, ... }
   **/
  static async getById(contact_id) {
    const result = await db.query(
      `SELECT pc.contact_id, pc.patient_id, pc.provider_id, pc.subject, pc.message,
              pc.patient_name, pc.patient_email, pc.patient_phone, pc.preferred_contact_method,
              pc.urgency_level, pc.status, pc.provider_response, pc.created_at, pc.updated_at, pc.responded_at,
              mu_patient.name as patient_full_name,
              mu_provider.name as provider_name
       FROM ProviderContacts pc
       INNER JOIN Patients p ON pc.patient_id = p.patient_id
       INNER JOIN MasterUsers mu_patient ON p.user_id = mu_patient.user_id
       INNER JOIN HealthcareProviders hp ON pc.provider_id = hp.provider_id
       INNER JOIN MasterUsers mu_provider ON hp.user_id = mu_provider.user_id
       WHERE pc.contact_id = $1`,
      [contact_id]
    );

    const contact = result.rows[0];
    if (!contact) {
      throw new NotFoundError(`No contact found with id: ${contact_id}`);
    }

    return contact;
  }

  /** Update contact status (typically used to mark as read, responded, etc.)
   *
   * data can include: { status, provider_response }
   *
   * Returns { contact_id, status, updated_at }
   **/
  static async update(contact_id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const contactIdVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE ProviderContacts
                      SET ${setCols}
                      WHERE contact_id = ${contactIdVarIdx}
                      RETURNING contact_id, status, updated_at`;

    const result = await db.query(querySql, [...values, contact_id]);
    const contact = result.rows[0];

    if (!contact) {
      throw new NotFoundError(`No contact found with id: ${contact_id}`);
    }

    return contact;
  }

  /** Get contact statistics for a provider */
  static async getProviderStats(provider_id) {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_contacts,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_contacts,
         COUNT(CASE WHEN status = 'read' THEN 1 END) as read_contacts,
         COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded_contacts,
         COUNT(CASE WHEN urgency_level = 'urgent' THEN 1 END) as urgent_contacts
       FROM ProviderContacts
       WHERE provider_id = $1`,
      [provider_id]
    );

    return result.rows[0];
  }

  /** Delete a contact request */
  static async remove(contact_id) {
    const result = await db.query(
      `DELETE FROM ProviderContacts
       WHERE contact_id = $1
       RETURNING contact_id`,
      [contact_id]
    );

    const contact = result.rows[0];
    if (!contact) {
      throw new NotFoundError(`No contact found with id: ${contact_id}`);
    }

    return { deleted: contact.contact_id };
  }
}

module.exports = ProviderContacts;
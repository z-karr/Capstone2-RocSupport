"use strict";

const { BadRequestError } = require("../expressError");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ajv = new Ajv({ allErrors: true, strictSchema: false });
addFormats(ajv);

// Add referenced schemas
const addressSchema = require("../schemas/address.json");
const phoneSchema = require("../schemas/phone.json");
ajv.addSchema(addressSchema, "./address.json");
ajv.addSchema(phoneSchema, "./phone.json");

/**
 * Middleware to validate request body against a JSON schema using AJV.
 * Throws BadRequestError if validation fails.
 */
const validatorSchema = (schema) => (req, res, next) => {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(req.body);
    if (!valid) {
      const errors = validate.errors.map(
        (error) => `${error.instancePath} ${error.message}`
      );
      throw new BadRequestError(errors.join("; "));
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = validatorSchema;

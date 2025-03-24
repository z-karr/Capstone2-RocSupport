"use strict";

// const { validate } = require('jsonschema');
const { BadRequestError } = require('../expressError');
const path = require('path');
const Ajv = require('ajv');
const { ValidatorResult } = require('jsonschema');
const ajv = new Ajv({ allErrors: true, strictSchema: false })

// Load the schemas
const addressSchema = require(path.join(__dirname, '../schemas/address.json'));
const phoneSchema = require(path.join(__dirname, '../schemas/phone.json'));

ajv.addSchema(addressSchema, "address.json")
ajv.addSchema(phoneSchema, "phone.json")


// In middleware/validator.js
const validatorSchema = (schema) => (req, res, next) => {
    try {
        const validate = ajv.compile(schema)
        const validationResult = validate(req.body, schema);
        console.log(validationResult)
        if (!validationResult) {
            console.log(validate.errors)
            const errors = validate.errors.map(error => error.stack);
            return res.status(500).json({ error: "Server response does not match schema", details: errors });
        }
    } catch (err) {
        next(err);
    }
    next();
};

module.exports = validatorSchema;

// const validatorSchema = (schema) => (req, res, next) => {
//     try {
//         console.log('Received data for validation:', req.body);
//         const validationResult = v.validate(req.body, schema);
//         if (!validationResult.valid) {
//             const errors = validationResult.errors.map(error => error.stack);
//             throw new BadRequestError(errors);
//         }
//         return next();
//     } catch (err) {
//         next(err); // Pass any unexpected errors to the next middleware
//     }
// };

// module.exports = validatorSchema;


// "use strict";

// const { validate } = require('jsonschema');
// const { BadRequestError } = require('../expressError');


// const validatorSchema = (schema) => (req, res, next) => {
//     try {
//         const validationResult = validate(req.body, schema);
//         if (!validationResult.valid) {
//             const errors = validationResult.errors.map(error => error.stack);
//             throw new BadRequestError(errors);
//         }
//         return next();
//     } catch (err) {
//         next(err); // Pass any unexpected errors to the next middleware
//     }
// };

// module.exports = validatorSchema;
/** Routes for civilian authentication */

"use strict";

const express = require('express');
const router = express.Router();
const { validate } = require('jsonschema');
const userSignupSchema = require('../../schemas/userSignup.json');
const userLoginSchema = require('../../schemas/userLogin.json');
const { BadRequestError } = require('../../expressError');
const User = require('../../models/Users');
const { createToken } = require('../../helpers/tokens');
const validatorSchema = require('../../middleware/validator');
const { request } = require('../../app');

/** POST /signup: { user } => { token }
 *
 * user must include { username, email, password, type, bio, address, phone }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post('/signup', validatorSchema(userSignupSchema), async function (req, res, next) {
    try {
        console.log(req.body)
        const newUser = await User.register(req.body);
        const token = createToken(newUser);
        return res.status(201).json({ token, user: newUser });
    } catch (err) {
        return next(err);
    }

});

/** POST /login: { email, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post('/login', validatorSchema(userLoginSchema), async function (req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await User.authenticate(email, password);
        const token = createToken(user);
        console.log(token)
        return res.json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                bio: user.bio
            }
        });
        // return res.json({ token, id: user.user_id });
    } catch (err) {
        // This will catch the "Invalid username/password" error and any other errors
        return next(err);
    }
});

module.exports = router;
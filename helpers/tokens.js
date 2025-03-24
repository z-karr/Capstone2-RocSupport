const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */

function createToken(user) {

    console.log(user)
    let payload = {
        userId: user.user_id,
        username: user.username,
        isAdmin: user.isAdmin || false,
    };

    return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };

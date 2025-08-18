const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */

function createToken(user) {
    console.log('Creating token for user:', user);
    let payload = {
        userId: user.user_id,
        username: user.username,
        isAdmin: user.isAdmin || false,
        type: user.type,
        email: user.email
    };

    // Add patient_id if it exists (for patients)
    if (user.patient_id) {
        payload.patient_id = user.patient_id;
    }

    // Add provider_id if it exists (for providers)
    if (user.provider_id) {
        payload.provider_id = user.provider_id;
    }

    console.log('Token payload:', payload);
    
    // Set token to expire in 24 hours (86400 seconds)
    const options = {
        expiresIn: '24h'
    };
    
    return jwt.sign(payload, SECRET_KEY, options);
}

module.exports = { createToken };

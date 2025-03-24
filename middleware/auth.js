"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */
function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        console.log('Auth header:', authHeader);
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, "").trim();
            const decoded = jwt.verify(token, SECRET_KEY);
            console.log('Decoded token:', decoded);
            res.locals.user = decoded;
            if (decoded.isProvider) {
                res.locals.provider = decoded;
            }
            console.log('res.locals after decoding:', res.locals);
        }
        return next();
    } catch (err) {
        console.error('JWT authentication error:', err);
        return next(err);
    }
}

function ensureCorrectProvider(req, res, next) {
    try {

        console.log('In ensureCorrectProvider');
        console.log('res.locals:', res.locals);
        console.log('req.params:', req.params);

        const provider = res.locals.provider;
        if (!provider || !provider.isProvider) {
            console.log('Provider check failed:', provider);
            throw new UnauthorizedError("Not authenticated as a healthcare provider");
        }

        console.log('Provider ID from token:', provider.healthcareprovider_id);
        console.log('Provider ID from URL:', req.params.healthcareprovider_id);

        if (provider.healthcareprovider_id !== parseInt(req.params.healthcareprovider_id)) {
            console.log('Provider ID mismatch:', provider.healthcareprovider_id, req.params.healthcareprovider_id);
            throw new UnauthorizedError("Not authorized to access this profile");
        }
        console.log('Provider authorized');
        return next();
    } catch (err) {
        return next(err);
    }
}
// function authenticateJWT(req, res, next) {
//     try {
//         const authHeader = req.headers && req.headers.authorization;
//         if (authHeader) {
//             const token = authHeader.replace(/^[Bb]earer /, "").trim();
//             const decoded = jwt.verify(token, SECRET_KEY);
//             // res.locals.user = jwt.verify(token, SECRET_KEY);
//             res.locals.user = decoded;

//             // Check if the decoded token contains provider-specific information
//             if (decoded.isProvider) {
//                 res.locals.provider = decoded;
//             }
//         }
//         return next();
//     } catch (err) {
//         return next();
//     }
// }

/** Middleware to use when a Civilian User must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
    try {
        console.log(req.headers)
        if (!req.headers.authorization) throw new UnauthorizedError();
        const user = jwt.decode(req.headers.authorization.split(" ")[1]);
        if (!user) throw new UnauthorizedError();
        req.user = user;
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to use when they must provide a valid token & be user matching
 *  username provided as route param.
 *
 *  If not, raises Unauthorized.
 */

function ensureCorrectUserOrAdmin(req, res, next) {
    try {
        const user = res.locals.user;
        if (!(user && (user.isAdmin || user.username === req.params.username))) {
            throw new UnauthorizedError();
        }
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Middleware to ensure the correct provider is accessing their own profile. */
function ensureCorrectProvider(req, res, next) {
    try {
        const provider = res.locals.provider;
        if (!provider || !provider.isProvider) {
            throw new UnauthorizedError("Not authenticated as a healthcare provider");
        }
        if (provider.healthcareprovider_id !== parseInt(req.params.healthcareprovider_id)) {
            throw new UnauthorizedError("Not authorized to access this profile");
        }
        return next();
    } catch (err) {
        return next(err);
    }
    //     const provider = res.locals.provider;
    //     console.log('Provider from res.locals:', provider);
    //     console.log('healthcareprovider_id from params:', req.params.healthcareprovider_id);

    //     if (!(provider && provider.healthcareprovider_id === parseInt(req.params.healthcareprovider_id))) {
    //         console.log('Condition not met, throwing UnauthorizedError');
    //         throw new UnauthorizedError();
    //     }
    //     return next();
    // } catch (err) {
    //     return next(err);
    // }
}


module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureCorrectUserOrAdmin,
    ensureCorrectProvider,
};

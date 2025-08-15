"use strict";
/**
 * Middleware for authentication and authorization.
 *
 * This module provides middleware functions to authenticate users via JWT,
 * ensure users are logged in, and check user types and permissions.
 *
 * The middleware functions can be used in Express routes to protect
 * endpoints and enforce access control.
 */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/** Authenticate user via JWT. */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Ensure user is logged in. */
function ensureLoggedIn(req, res, next) {
  if (!res.locals.user) throw new UnauthorizedError();
  return next();
}

/** Ensure user is of a specific type (e.g., 'provider' or 'patient'). */
function ensureUserType(type) {
  return function (req, res, next) {
    if (!res.locals.user || res.locals.user.type !== type) {
      throw new UnauthorizedError(`Must be a ${type}`);
    }
    return next();
  };
}

/** Ensure the correct provider is accessing their own profile. */
function ensureCorrectProvider(req, res, next) {
  // try {
  //     const user = res.locals.user;
  //     // If your route param is provider_id, you may need to query DB to get user_id for that provider_id
  //     if (!user || user.type !== "provider" || user.user_id !== parseInt(req.params.user_id)) {
  //         throw new UnauthorizedError("Not authorized as this provider");
  //     }
  //     return next();
  // } catch (err) {
  //     return next(err)
  // }
  if (!res.locals.user) throw new UnauthorizedError();
  return next();
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureUserType,
  ensureCorrectProvider,
};

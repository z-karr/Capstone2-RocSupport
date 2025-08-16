"use strict";

/** Express app for ROC Support app. */

const express = require("express");

const { NotFoundError } = require("./expressError");

const app = express()

// Parse JSON bodies
app.use(express.json());


const cors = require('cors');

// Allow requests from any origin
app.use(cors());





// Mount unified authentication route
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

// Mount routes for civilians
const homepageRoutes = require("./routes/Civilians/homepage");
const civilianAuthenticationRoutes = require("./routes/Civilians/authentication");
const civilianProfileRoutes = require("./routes/Civilians/profile");
const favoritesRoutes = require("./routes/Civilians/favorites");

app.use("/", homepageRoutes);
app.use("/civilians", civilianAuthenticationRoutes);
app.use("/civilians", civilianProfileRoutes);
app.use("/civilians", favoritesRoutes);

// Mount routes for providers
const providerAuthenticationRoutes = require("./routes/Providers/authentication");
const providerProfileRoutes = require("./routes/Providers/profile");

app.use("/provider", providerAuthenticationRoutes);
app.use("/provider", providerProfileRoutes);

// Mount routes for emergency resources
const emergencyResourcesRoutes = require("./routes/EmergencyResources");

app.use("/emergency-resources", emergencyResourcesRoutes);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
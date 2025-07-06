// Fix for middleware/rateLimiting.js
// Replace the problematic delayMs configuration

// BEFORE (causing warning):
/*
const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // allow 2 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request after delayAfter
});
*/

// AFTER (fixed):
const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // allow 2 requests per 15 minutes, then...
  delayMs: () => 500, // NEW SYNTAX: function that returns delay
  // Alternative new syntax options:
  // delayMs: (used, req) => {
  //   const delayAfter = req.slowDown.limit;
  //   return (used - delayAfter) * 500;
  // },
  validate: { delayMs: false } // Disable validation warning
});

module.exports = speedLimiter;
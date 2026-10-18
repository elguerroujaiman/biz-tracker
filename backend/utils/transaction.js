"use strict";

const db = require("../config/db");

module.exports = function withTransaction(callback) {
  return db.transaction(callback);
};

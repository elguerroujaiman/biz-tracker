"use strict";

const secret = process.env.JWT_SECRET;
const localDevelopmentSecret = "local-development-secret-change-before-deploying-32-chars";
const knownDemoSecret = "local-docker-secret-change-this-before-deployment-123456";

if (
  process.env.NODE_ENV === "production" &&
  (!secret || secret.length < 32 || secret === knownDemoSecret || /replace-with|your_jwt_secret/i.test(secret))
) {
  throw new Error("Set a unique JWT_SECRET of at least 32 characters before starting in production.");
}

module.exports = secret || localDevelopmentSecret;

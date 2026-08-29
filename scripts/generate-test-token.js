// scripts/generate-test-token.js
//
// Generates a test JWT signed with the local JWT_SECRET, for manual Postman
// testing against this service before a real ERP login is wired up.
//
// Usage: node scripts/generate-test-token.js <role> [name] [email]
// Example: node scripts/generate-test-token.js placement_coordinator "Priya Nair" priya@test.com

import "dotenv/config";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const [, , role, name, email] = process.argv;

if (!role) {
  console.error("Usage: node scripts/generate-test-token.js <role> [name] [email]");
  console.error("Roles: student | professor | hod | dean | admin | placement_coordinator");
  process.exit(1);
}

const payload = {
  id: crypto.randomUUID(),
  name: name || `Test ${role}`,
  email: email || `test.${role}@example.com`,
  role,
};

const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
});

console.log("\nPayload:");
console.log(JSON.stringify(payload, null, 2));
console.log("\nToken:");
console.log(token);
console.log("\nUse in Postman as header:");
console.log(`Authorization: Bearer ${token}\n`);

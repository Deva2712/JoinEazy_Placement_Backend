// src/modules/auth/auth-service.js
import jwt from "jsonwebtoken";
import { User } from "./auth-model.js";

const unauthorized = (m) => { const e = new Error(m); e.statusCode = 401; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const generateToken = (id, role, name, email) =>
  jwt.sign({ id, role, name, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

export const service = {
  login: async (email, password) => {
    if (!email || !password) badRequest("Please provide email and password");
    const user = await User.findOne({ where: { email } });
    if (!user) unauthorized("Invalid email or password");
    const isMatch = await user.comparePassword(password);
    if (!isMatch) unauthorized("Invalid email or password");

    const name = user.name || user.email;
    const token = generateToken(user.id, user.role, name, user.email);
    const userJson = user.toJSON();
    delete userJson.password;
    userJson.name = name;
    return { token, user: userJson };
  },
};

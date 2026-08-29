// src/modules/auth/auth-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./auth-service.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await service.login(email, password);
  res.cookie("token", result.token, COOKIE_OPTIONS);
  res.json({ success: true, data: result });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) =>
  res.json({ success: true, data: req.user }));

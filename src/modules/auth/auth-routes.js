// src/modules/auth/auth-routes.js
//
// No public /register — placement_coordinator accounts are seeded/admin-created
// only, not self-signup.
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./auth-controller.js";

const router = express.Router();

router.post("/login",  ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me",      protect, ctrl.me);

export default router;

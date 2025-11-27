import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Email/password auth
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Google OAuth
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);

// Token management
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// User profile
router.get("/me", requireAuth, authController.me);
router.put("/profile/username", requireAuth, authController.updateUsername);
router.put("/profile/password", requireAuth, authController.changePassword);
router.put("/profile/language", requireAuth, authController.updateLanguage);
router.delete("/profile/account", requireAuth, authController.deleteAccount);

// Username availability check (public route)
router.get(
	"/username/check/:username",
	authController.checkUsernameAvailability
);

export default router;

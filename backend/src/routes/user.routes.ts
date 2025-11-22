import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public routes (no authentication required)
router.get("/profile/:username", userController.getUserProfileByUsername);

// Protected routes (authentication required)
router.get("/profile", requireAuth, userController.getProfile);
router.post("/upload-avatar", requireAuth, userController.uploadAvatar);
router.delete("/avatar", requireAuth, userController.deleteAvatar);

export default router;

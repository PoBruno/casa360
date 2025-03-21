import { Router } from "express"
import {
  register,
  login,
  getProfile,
  updateProfile,
  updateSettings,
  changePassword,
} from "../controllers/authController"
import { authenticate } from "../middleware/auth"

const router = Router()

// Public routes
router.post("/register", register)
router.post("/login", login)

// Protected routes
router.get("/profile", authenticate, getProfile)
router.put("/profile", authenticate, updateProfile)
router.put("/settings", authenticate, updateSettings)
router.put("/change-password", authenticate, changePassword)

export default router


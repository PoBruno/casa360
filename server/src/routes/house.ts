import { Router } from "express"
import {
  createHouse,
  getUserHouses,
  getHouseById,
  updateHouse,
  deleteHouse,
  inviteUserToHouse,
  acceptInvitation,
  getHouseMembers,
  updateMemberRole,
  removeMember,
  leaveHouse,
  transferOwnership,
} from "../controllers/houseController"
import { authenticate } from "../middleware/auth"
import { validateHouseAccess, requirePermission } from "../middleware/houseAuth"

const router = Router()

// House management routes
router.post("/", authenticate, createHouse)
router.get("/", authenticate, getUserHouses)
router.get("/:house_id", authenticate, validateHouseAccess, getHouseById)
router.put("/:house_id", authenticate, validateHouseAccess, requirePermission("admin"), updateHouse)
router.delete("/:house_id", authenticate, validateHouseAccess, requirePermission("admin"), deleteHouse)

// House membership routes
router.post("/:house_id/invite", authenticate, validateHouseAccess, requirePermission("admin"), inviteUserToHouse)
router.post("/invitations/:token/accept", authenticate, acceptInvitation)
router.get("/:house_id/members", authenticate, validateHouseAccess, getHouseMembers)
router.put(
  "/:house_id/members/:member_id",
  authenticate,
  validateHouseAccess,
  requirePermission("admin"),
  updateMemberRole,
)
router.delete(
  "/:house_id/members/:member_id",
  authenticate,
  validateHouseAccess,
  requirePermission("admin"),
  removeMember,
)
router.post("/:house_id/leave", authenticate, validateHouseAccess, leaveHouse)
router.post(
  "/:house_id/transfer-ownership",
  authenticate,
  validateHouseAccess,
  requirePermission("admin"),
  transferOwnership,
)

export default router


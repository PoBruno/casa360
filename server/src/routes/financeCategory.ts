import { Router } from "express"
import { authenticate } from "../middleware/auth"
import { validateHouseAccess } from "../middleware/houseAuth"
import {
  getFinanceCategories,
  getFinanceCategoryById,
  createFinanceCategory,
  updateFinanceCategory,
  deleteFinanceCategory,
} from "../controllers/financeCategoryController"

const router = Router({ mergeParams: true })

const houseMiddleware = [authenticate, validateHouseAccess]

router.get("/", houseMiddleware, getFinanceCategories)
router.get("/:id", houseMiddleware, getFinanceCategoryById)
router.post("/", houseMiddleware, createFinanceCategory)
router.put("/:id", houseMiddleware, updateFinanceCategory)
router.delete("/:id", houseMiddleware, deleteFinanceCategory)

export default router


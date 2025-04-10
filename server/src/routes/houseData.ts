import { Router, Request, Response, NextFunction } from "express"
import { authenticate } from "../middleware/auth"
import { validateHouseAccess, requirePermission } from "../middleware/houseAuth"

// Importa somente os controllers existentes
import * as dashboardController from "../controllers/house/dashboardController"
import * as categoryController from "../controllers/house/categoryController"
import * as costCenterController from "../controllers/house/costCenterController"
import * as currencyController from "../controllers/house/currencyController"
import * as documentsController from "../controllers/house/documentsController"
import * as frequencyController from "../controllers/house/frequencyController"
import * as payersController from "../controllers/house/payersController"
import * as paymentController from "../controllers/house/paymentController"
import * as financeEntriesController from "../controllers/house/financeEntriesController"
import * as taskEntriesController from "../controllers/house/taskEntriesController"
import * as tasksController from "../controllers/house/tasksController"
// Remova os controllers ausentes (ex.: transactionsController, walletController)

const router = Router()

// Middlewares
const houseMiddleware = [authenticate, validateHouseAccess]
const writeMiddleware = [authenticate, validateHouseAccess, requirePermission("write")]
const adminMiddleware = [authenticate, validateHouseAccess, requirePermission("admin")]

// Dashboard rota
router.get("/:house_id/dashboard", houseMiddleware, dashboardController.getDashboardData)

// Rotas de Categories
router.get("/:house_id/categories", houseMiddleware, categoryController.getAll)
router.get("/:house_id/categories/:id", houseMiddleware, categoryController.getById)
router.post("/:house_id/categories", houseMiddleware, categoryController.create)
router.put("/:house_id/categories/:id", houseMiddleware, categoryController.update)
router.delete("/:house_id/categories/:id", houseMiddleware, categoryController.remove)

// Rotas de Cost Centers
router.get("/:house_id/cost-centers", houseMiddleware, costCenterController.getAll)
router.get("/:house_id/cost-centers/:id", houseMiddleware, costCenterController.getById)
router.post("/:house_id/cost-centers", writeMiddleware, costCenterController.create)
router.put("/:house_id/cost-centers/:id", writeMiddleware, costCenterController.update)
router.delete("/:house_id/cost-centers/:id", writeMiddleware, costCenterController.remove)

// Rotas de Currency
router.get("/:house_id/currencies", houseMiddleware, currencyController.getAll)
router.get("/:house_id/currencies/:id", houseMiddleware, currencyController.getById)
router.post("/:house_id/currencies", adminMiddleware, currencyController.create)
router.put("/:house_id/currencies/:id", adminMiddleware, currencyController.update)
router.delete("/:house_id/currencies/:id", adminMiddleware, currencyController.remove)

// Rotas de Documents
router.get("/:house_id/documents", houseMiddleware, documentsController.getAll)
router.get("/:house_id/documents/:id", houseMiddleware, documentsController.getById)
router.post("/:house_id/documents", writeMiddleware, documentsController.upload)
router.delete("/:house_id/documents/:id", writeMiddleware, documentsController.remove)

// Rotas de Frequency
router.get("/:house_id/frequencies", houseMiddleware, frequencyController.getAll)
router.get("/:house_id/frequencies/:id", houseMiddleware, frequencyController.getById)
router.post("/:house_id/frequencies", adminMiddleware, frequencyController.create)
router.put("/:house_id/frequencies/:id", adminMiddleware, frequencyController.update)
router.delete("/:house_id/frequencies/:id", adminMiddleware, frequencyController.remove)

// Rotas de Payers
router.get("/:house_id/payers", houseMiddleware, payersController.getAll)
router.get("/:house_id/payers/:id", houseMiddleware, payersController.getById)
router.post("/:house_id/payers", writeMiddleware, payersController.create)
router.put("/:house_id/payers/:id", writeMiddleware, payersController.update)
router.delete("/:house_id/payers/:id", writeMiddleware, payersController.remove)

// Rotas de Payment
router.get("/:house_id/payments", houseMiddleware, paymentController.getAll)
router.get("/:house_id/payments/:id", houseMiddleware, paymentController.getById)
router.post("/:house_id/payments", writeMiddleware, paymentController.create)
router.put("/:house_id/payments/:id", writeMiddleware, paymentController.update)
router.delete("/:house_id/payments/:id", writeMiddleware, paymentController.remove)

// Rotas de Finance Entries
router.get("/:house_id/finance-entries", houseMiddleware, financeEntriesController.getAll)
router.get("/:house_id/finance-entries/:id", houseMiddleware, financeEntriesController.getById)
router.post("/:house_id/finance-entries", writeMiddleware, financeEntriesController.create)
router.put("/:house_id/finance-entries/:id", writeMiddleware, financeEntriesController.update)
router.delete("/:house_id/finance-entries/:id", writeMiddleware, financeEntriesController.remove)

// Rotas de Task Entries
router.get("/:house_id/task-entries", houseMiddleware, taskEntriesController.getAll)
router.get("/:house_id/task-entries/:id", houseMiddleware, taskEntriesController.getById)
router.post("/:house_id/task-entries", writeMiddleware, taskEntriesController.create)
router.put("/:house_id/task-entries/:id", writeMiddleware, taskEntriesController.update)
router.delete("/:house_id/task-entries/:id", writeMiddleware, taskEntriesController.remove)

// Rotas de Tasks – caso os métodos de criação/atualização não existam em tasksController, remova-os ou crie stubs.
router.get("/:house_id/tasks", houseMiddleware, tasksController.getAll)
router.get("/:house_id/tasks/:id", houseMiddleware, tasksController.getById)

// Debug/testing endpoints
router.post("/:house_id/debug/setup-test-user", adminMiddleware, setupController.setupTestUser)

export default router

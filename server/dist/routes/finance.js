"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financeController_1 = require("../controllers/financeController");
const router = (0, express_1.Router)();
// Get all finance records
router.get('/', financeController_1.getAllFinanceRecords);
// Get a finance record by ID
router.get('/:id', financeController_1.getFinanceRecordById);
// Create a new finance record
router.post('/', financeController_1.createFinanceRecord);
// Update a finance record by ID
router.put('/:id', financeController_1.updateFinanceRecord);
// Delete a finance record by ID
router.delete('/:id', financeController_1.deleteFinanceRecord);
exports.default = router;

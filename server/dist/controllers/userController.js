"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHouses = exports.createHouse = void 0;
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const createHouse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, houseName } = req.body;
    if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    const dbManager = databaseManager_1.default.getInstance();
    try {
        const userPool = yield dbManager.getUserPool();
        const result = yield userPool.query('INSERT INTO houses (user_id, house_name) VALUES ($1, $2) RETURNING id', [userId, houseName]);
        const houseId = result.rows[0].id;
        yield dbManager.createHouseDatabase(houseId);
        yield userPool.query('INSERT INTO house_users (user_id, house_id, role) VALUES ($1, $2, $3)', [userId, houseId, 'owner']);
        res.status(201).json({ houseId });
    }
    catch (error) {
        console.error('Error creating house:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Error creating house', error: errorMessage });
    }
});
exports.createHouse = createHouse;
const getUserHouses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const userPool = yield dbManager.getUserPool();
        const result = yield userPool.query('SELECT * FROM houses WHERE user_id = $1', [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Error fetching houses', error: errorMessage });
    }
});
exports.getUserHouses = getUserHouses;

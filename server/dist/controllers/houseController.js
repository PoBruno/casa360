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
exports.getHousesByUser = exports.createHouse = void 0;
const houseService_1 = require("../services/houseService");
const databaseManager_1 = __importDefault(require("../services/databaseManager"));
const createHouse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { houseName, address } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Pega o userId do token
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    if (!houseName) {
        return res.status(400).json({ message: 'House name is required' });
    }
    try {
        const house = yield (0, houseService_1.createHouseEntry)({
            user_id: userId,
            house_name: houseName
        });
        // Create database using house.id instead of house_name
        yield (0, houseService_1.createHouseDatabase)(house.id);
        yield (0, houseService_1.executeHouseTablesScript)(house.id);
        res.status(201).json({ houseId: house.id });
    }
    catch (error) {
        console.error('Error creating house:', error);
        res.status(500).json({ message: 'Error creating house', error });
    }
});
exports.createHouse = createHouse;
const getHousesByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id; // Pega o userId do token
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    try {
        const dbManager = databaseManager_1.default.getInstance();
        const userPool = yield dbManager.getUserPool();
        const result = yield userPool.query('SELECT * FROM houses WHERE user_id = $1', [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Error fetching houses:', error);
        res.status(500).json({ message: 'Error fetching houses', error });
    }
});
exports.getHousesByUser = getHousesByUser;

import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { validateHouseAccess } from "../middleware/houseAuth";

// Importa somente as rotas que existem
import usersRouter from "./user";
import houseRouter from "./house";
import houseDataRoutes from "./houseData";
import authRoutes from "./auth";

const router = Router();

// Rotas públicas
router.use("/auth", authRoutes);
router.use("/users", usersRouter);
router.use("/houses", houseRouter);
router.use("/house", houseDataRoutes);

// Agrupa todas as rotas relacionadas à casa sob /house/:house_id
router.use("/house/:house_id", [authenticate, validateHouseAccess], (req: Request, res: Response, next: NextFunction) => {
  next();
});

export default router;


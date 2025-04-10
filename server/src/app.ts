/// <reference path="./types/express/custom.d.ts" />

import express from "express";
import dotenv from "dotenv";
import routes from "./routes";
import errorHandler from "./middleware/error";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from "./routes/auth";
import houseRoutes from "./routes/house";

// Importa as pools para validação
import { userPool } from "./config/database";
import { dataCasaPool } from "./config/dataCasa";  // pool para instância data-casa

dotenv.config();

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Rotas de autenticação e demais endpoints
app.use("/api/auth", authRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api", routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(errorHandler);

// Função para validar conexões com as duas instâncias
const validateConnections = async () => {
  try {
    await userPool.query("SELECT 1");
    console.log("Conexão com a instância data-user validada com sucesso.");
  } catch (err) {
    console.error("Erro ao conectar com a instância data-user:", err);
  }
  
  try {
    await dataCasaPool.query("SELECT 1");
    console.log("Conexão com a instância data-casa validada com sucesso.");
  } catch (err) {
    console.error("Erro ao conectar com a instância data-casa:", err);
  }
}

// Chama a validação e inicia o servidor
validateConnections().then(() => {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
  });
});

export default app;


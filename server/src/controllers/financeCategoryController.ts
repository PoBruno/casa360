import type { Request, Response } from "express"
import DatabaseManager from "../services/databaseManager"

export const getFinanceCategories = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM category ORDER BY id")
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar categorias", details: error })
  }
}

export const getFinanceCategoryById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params
  try {
    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM finance_category WHERE id = $1", [id])
    if (result.rows.length) {
      res.json(result.rows[0])
    } else {
      res.status(404).json({ message: "Categoria não encontrada" })
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar categoria", details: error })
  }
}

export const createFinanceCategory = async (req: Request, res: Response) => {
  const { house_id } = req.params
  const { name, parent_category_id } = req.body
  try {
    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query(
      "INSERT INTO category (name, parent_category_id) VALUES ($1, $2) RETURNING *",
      [name, parent_category_id],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar categoria", details: error })
  }
}

export const updateFinanceCategory = async (req: Request, res: Response) => {
  const { house_id, id } = req.params
  const { name, parent_category_id } = req.body
  try {
    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query(
      "UPDATE finance_category SET name = $1, parent_category_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, parent_category_id, id],
    )

    if (result.rows.length) {
      res.json(result.rows[0])
    } else {
      res.status(404).json({ message: "Categoria não encontrada" })
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar categoria", details: error })
  }
}

export const deleteFinanceCategory = async (req: Request, res: Response) => {
  const { house_id, id } = req.params
  try {
    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("DELETE FROM finance_category WHERE id = $1 RETURNING *", [id])
    if (result.rows.length) {
      res.status(204).send()
    } else {
      res.status(404).json({ message: "Categoria não encontrada" })
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar categoria", details: error })
  }
}


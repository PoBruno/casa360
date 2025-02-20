import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET TUDO: Lista todas as Categorias Financeiras
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_Category');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET POR ID: Retorna uma Categoria Financeira específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Finance_Category WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Registro não encontrado' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere uma nova Categoria Financeira
router.post('/', async (req, res) => {
  try {
    const { name, parent_category_id, description } = req.body;
    const result = await query(
      `INSERT INTO Finance_Category (name, parent_category_id, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, parent_category_id, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza uma Categoria Financeira
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_category_id, description } = req.body;
    const result = await query(
      `UPDATE Finance_Category
       SET name = $1, parent_category_id = $2, description = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name, parent_category_id, description, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Registro não encontrado' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove uma Categoria Financeira
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Finance_Category WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
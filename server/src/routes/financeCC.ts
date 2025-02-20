import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET TUDO: Lista todos os Centros de Custo
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_CC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET POR ID: Retorna um Centro de Custo específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Finance_CC WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Registro não encontrado' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere um novo Centro de Custo
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await query(
      `INSERT INTO Finance_CC (name, description)
       VALUES ($1, $2) RETURNING *`,
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza um Centro de Custo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await query(
      `UPDATE Finance_CC
       SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, description, id]
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

// DELETE: Remove um Centro de Custo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Finance_CC WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
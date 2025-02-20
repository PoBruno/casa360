import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todos os produtos
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Products');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Busca produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Products WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere novo produto
router.post('/', async (req, res) => {
  try {
    const { name, description, category_id, quantity, unit_price, supplier_id, rfp_id } = req.body;
    const result = await query(
      `INSERT INTO Products 
       (name, description, category_id, quantity, unit_price, supplier_id, rfp_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, category_id, quantity, unit_price, supplier_id, rfp_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza produto por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, quantity, unit_price, supplier_id, rfp_id } = req.body;
    const result = await query(
      `UPDATE Products
       SET name = $1, description = $2, category_id = $3, quantity = $4, unit_price = $5, supplier_id = $6, rfp_id = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [name, description, category_id, quantity, unit_price, supplier_id, rfp_id, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove produto por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todos os fornecedores
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Suppliers');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Busca fornecedor por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Suppliers WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere novo fornecedor
router.post('/', async (req, res) => {
  try {
    const { name, contact_info, website, address, supplier_type, rating } = req.body;
    const result = await query(
      `INSERT INTO Suppliers 
       (name, contact_info, website, address, supplier_type, rating)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, contact_info, website, address, supplier_type, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza fornecedor por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_info, website, address, supplier_type, rating } = req.body;
    const result = await query(
      `UPDATE Suppliers
       SET name = $1, contact_info = $2, website = $3, address = $4, supplier_type = $5, rating = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, contact_info, website, address, supplier_type, rating, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove fornecedor por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Suppliers WHERE id = $1', [id])
      .catch((err: Error) => {
        console.error('Database connection error', err.stack);
      });
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
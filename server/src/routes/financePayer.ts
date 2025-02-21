import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const router = Router({ mergeParams: true });

// GET: Retorna todas as categorias financeiras
router.get('/house/:house_id/finance-payer', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_Payer ORDER BY id');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Finance_Payer' });
  }
});

// GET: Retorna um pagador por ID
router.get('/house/:house_id/finance-payer/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_Payer WHERE id = $1', [id]);
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Finance_Payer não encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Finance_Payer' });
  }
});

// POST: Insere um novo pagador
router.post('/house/:house_id/finance-payer', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `INSERT INTO Finance_Payer (name, created_at, updated_at)
       VALUES ($1, NOW(), NOW()) RETURNING *`,
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inserir Finance_Payer' });
  }
});

// PUT: Atualiza um pagador por ID
router.put('/house/:house_id/finance-payer/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `UPDATE Finance_Payer SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [name, id]
    );
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Finance_Payer não encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar Finance_Payer' });
  }
});

// DELETE: Remove um pagador por ID
router.delete('/house/:house_id/finance-payer/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('DELETE FROM Finance_Payer WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) res.status(200).json({ message: 'Finance_Payer removido com sucesso' });
    else res.status(404).json({ message: 'Finance_Payer não encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar Finance_Payer' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const router = Router({ mergeParams: true });

// GET: Retorna todas as frequências financeiras
router.get('/house/:house_id/finance-frequency', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_Frequency ORDER BY id');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Finance_Frequency' });
  }
});

// GET: Retorna uma frequência financeira por ID
router.get('/house/:house_id/finance-frequency/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_Frequency WHERE id = $1', [id]);
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Finance_Frequency não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Finance_Frequency' });
  }
});

// POST: Insere uma nova frequência financeira
router.post('/house/:house_id/finance-frequency', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name, days_interval } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `INSERT INTO Finance_Frequency (name, days_interval, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW()) RETURNING *`,
      [name, days_interval]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inserir Finance_Frequency' });
  }
});

// PUT: Atualiza uma frequência financeira por ID
router.put('/house/:house_id/finance-frequency/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name, days_interval } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `UPDATE Finance_Frequency 
       SET name = $1, days_interval = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, days_interval, id]
    );
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Finance_Frequency não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar Finance_Frequency' });
  }
});

// DELETE: Remove uma frequência financeira por ID
router.delete('/house/:house_id/finance-frequency/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('DELETE FROM Finance_Frequency WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) res.status(200).json({ message: 'Finance_Frequency removida com sucesso' });
    else res.status(404).json({ message: 'Finance_Frequency não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar Finance_Frequency' });
  }
});

export default router;

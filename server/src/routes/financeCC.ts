import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const router = Router({ mergeParams: true });


// GET: Retorna todas as frequências financeiras
router.get('/house/:house_id/finance-cc', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_CC ORDER BY id');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Finance_CC' });
  }
});

// GET: Retorna um centro de custo por ID
router.get('/house/:house_id/finance-cc/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_CC WHERE id = $1', [id]);
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Finance_CC não encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Finance_CC' });
  }
});

// POST: Insere um novo centro de custo
router.post('/house/:house_id/finance-cc', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name, description } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `INSERT INTO Finance_CC (name, description, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW()) RETURNING *`,
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inserir Finance_CC' });
  }
});

// PUT: Atualiza um centro de custo existente por ID
router.put('/house/:house_id/finance-cc/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name, description } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `UPDATE Finance_CC SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [name, description, id]
    );
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Finance_CC não encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar Finance_CC' });
  }
});

// DELETE: Remove um centro de custo por ID
router.delete('/house/:house_id/finance-cc/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('DELETE FROM Finance_CC WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) res.status(200).json({ message: 'Finance_CC removido com sucesso' });
    else res.status(404).json({ message: 'Finance_CC não encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar Finance_CC' });
  }
});

export default router;
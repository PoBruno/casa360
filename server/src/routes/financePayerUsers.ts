
import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const router = Router({ mergeParams: true });

// GET: Lista todas as associações
router.get('/house/:house_id/finance-payer-users', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query('SELECT * FROM Finance_Payer_Users ORDER BY finance_payer_id, user_id');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Finance_Payer_Users' });
  }
});

// GET: Retorna uma associação específica dado finance_payer_id e user_id
router.get('/house/:house_id/finance-payer-users/:payer_id/:user_id', async (req: Request, res: Response) => {
  const { house_id, payer_id, user_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `SELECT * FROM Finance_Payer_Users WHERE finance_payer_id = $1 AND user_id = $2`,
      [payer_id, user_id]
    );
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Associação não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar associação em Finance_Payer_Users' });
  }
});

// POST: Insere uma nova associação
router.post('/house/:house_id/finance-payer-users', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { finance_payer_id, user_id, percentage } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage)
       VALUES ($1, $2, $3) RETURNING *`,
      [finance_payer_id, user_id, percentage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inserir Finance_Payer_Users' });
  }
});

// PUT: Atualiza a associação (ex.: alterar percentage)
router.put('/house/:house_id/finance-payer-users/:payer_id/:user_id', async (req: Request, res: Response) => {
  const { house_id, payer_id, user_id } = req.params;
  const { percentage } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `UPDATE Finance_Payer_Users SET percentage = $1 WHERE finance_payer_id = $2 AND user_id = $3 RETURNING *`,
      [percentage, payer_id, user_id]
    );
    if (result.rows.length > 0) res.status(200).json(result.rows[0]);
    else res.status(404).json({ message: 'Associação não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar Finance_Payer_Users' });
  }
});

// DELETE: Remove uma associação por finance_payer_id e user_id
router.delete('/house/:house_id/finance-payer-users/:payer_id/:user_id', async (req: Request, res: Response) => {
  const { house_id, payer_id, user_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = await dbManager.getHousePool(house_id);
    const result = await pool.query(
      `DELETE FROM Finance_Payer_Users WHERE finance_payer_id = $1 AND user_id = $2 RETURNING *`,
      [payer_id, user_id]
    );
    if (result.rows.length > 0) res.status(200).json({ message: 'Associação removida com sucesso' });
    else res.status(404).json({ message: 'Associação não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar Finance_Payer_Users' });
  }
});

export default router;

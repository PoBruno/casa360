import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const router = Router({ mergeParams: true });

// GET: Lista todos os usuários para uma house
router.get('/house/:house_id/users', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    const result = await housePool.query('SELECT * FROM Users ORDER BY id');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// GET: Retorna um usuário específico por ID para uma house
router.get('/house/:house_id/users/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    const result = await housePool.query('SELECT * FROM Users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST: Insere um novo usuário para uma house
router.post('/house/:house_id/users', async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name, email, wallet, account_status } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    const result = await housePool.query(
      `INSERT INTO Users (name, email, wallet, account_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [name, email, wallet || 0, account_status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao inserir usuário' });
  }
});

// PUT: Atualiza um usuário existente por ID para uma house
router.put('/house/:house_id/users/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name, email, wallet, account_status } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    const result = await housePool.query(
      `UPDATE Users
       SET name = $1, email = $2, wallet = $3, account_status = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, email, wallet, account_status, id]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE: Remove um usuário por ID para uma house
router.delete('/house/:house_id/users/:id', async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);
    const result = await housePool.query(
      'DELETE FROM Users WHERE id = $1 RETURNING *', [id]
    );
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Usuário removido com sucesso' });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export default router;
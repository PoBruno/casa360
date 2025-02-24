import DatabaseManager from './databaseManager';

export const createUser = async (user: { username: string, email: string, password: string }) => {
  const dbManager = DatabaseManager.getInstance();
  const userPool = await dbManager.getUserPool();

  const result = await userPool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
    [user.username, user.email, user.password]
  );

  return result.rows[0];
};

export const getUserByEmail = async (email: string) => {
  const dbManager = DatabaseManager.getInstance();
  const userPool = await dbManager.getUserPool();

  const result = await userPool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

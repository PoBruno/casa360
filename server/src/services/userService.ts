import DatabaseManager from './databaseManager';

export const createHouse = async (userId: number, houseName: string) => {
  const dbManager = DatabaseManager.getInstance();
  const userPool = await dbManager.getUserPool();

  const result = await userPool.query(
    'INSERT INTO houses (user_id, house_name) VALUES ($1, $2) RETURNING id',
    [userId, houseName]
  );

  const houseId = result.rows[0].id;
  await dbManager.createHouseDatabase(houseId);

  return houseId;
};
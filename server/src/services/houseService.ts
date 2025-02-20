import { query as userQuery } from './database';
import { dataCasaPool } from '../config/dataCasa';
import fs from 'fs';
import path from 'path';

interface HouseInput {
  user_id: number;
  house_db_name: string;
  address: string;
}

export const createHouse = async ({ user_id, house_db_name, address }: HouseInput) => {
  // Insere o cadastro da casa na base data-user
  const insertResult = await userQuery(
    'INSERT INTO houses (user_id, house_db_name, address) VALUES ($1, $2, $3) RETURNING *',
    [user_id, house_db_name, address]
  );
  const house = insertResult.rows[0];

  // Conecta na instância data-casa para criar um novo banco de dados
  // Utilize uma conexão separada (usando um pool específico para criação de DB)
  const adminPool = new dataCasaPool.constructor({ // cria um novo pool para comandos administrativos
    host: process.env.DATA_CASA_HOST,
    user: process.env.DATA_CASA_USER,
    password: process.env.DATA_CASA_PASSWORD,
    database: process.env.DATA_CASA_NAME, // conecta na base padrão para poder emitir o comando CREATE DATABASE
    port: Number(process.env.DATA_CASA_PORT),
  });

  // Cria o novo banco com o nome igual à house_db_name (pode ser também house.id se preferir)
  await adminPool.query(`CREATE DATABASE "${house.house_db_name}"`);
  await adminPool.end();

  // Após criar o banco, execute o script de criação de tabelas nele
  // Conecta ao novo banco
  const newHousePool = new dataCasaPool.constructor({
    host: process.env.DATA_CASA_HOST,
    user: process.env.DATA_CASA_USER,
    password: process.env.DATA_CASA_PASSWORD,
    database: house.house_db_name,
    port: Number(process.env.DATA_CASA_PORT),
  });

  const sqlFilePath = path.join(__dirname, '../../db/data-casa/01-create-tables.sql');
  const sqlScript = fs.readFileSync(sqlFilePath, { encoding: 'utf8' });
  // Divida o script em comandos (assumindo que cada comando termine com “;”)
  const commands = sqlScript.split(/;\s*$/m).filter(Boolean);
  for (const command of commands) {
    await newHousePool.query(command);
  }
  await newHousePool.end();

  return house;
};
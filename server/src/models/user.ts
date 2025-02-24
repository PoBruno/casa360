// filepath: /backend/backend/src/models/user.ts
import { Pool } from 'pg';
import { User } from '../types/index';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const getAllUsers = async (): Promise<User[]> => {
    const result = await pool.query('SELECT * FROM Users');
    return result.rows;
};

export const getUserById = async (id: number): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM Users WHERE id = $1', [id]);
    return result.rows[0] || null;
};

export const createUser = async (user: User): Promise<User> => {
    const result = await pool.query(
        'INSERT INTO Users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [user.name, user.email, user.passwordHash]
    );
    return result.rows[0];
};

export const updateUser = async (id: number, user: Partial<User>): Promise<User | null> => {
    const result = await pool.query(
        'UPDATE Users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
        [user.name, user.email, id]
    );
    return result.rows[0] || null;
};

export const deleteUser = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM Users WHERE id = $1', [id]);
};

export default {
    createUser
};
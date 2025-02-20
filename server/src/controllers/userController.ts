import { Request, Response } from 'express';
import * as db from '../services/database';
import { User } from '../models/user';

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await db.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

// Get a user by ID
export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const user = await db.getUserById(id);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
};

// Create a new user
export const createUser = async (req: Request, res: Response) => {
    try {
        const newUser: User = req.body;
        const createdUser = await db.createUser(newUser);
        res.status(201).json(createdUser);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};

// Update a user by ID
export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const updatedUser: User = req.body;
        const result = await db.updateUser(id, updatedUser);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

// Delete a user by ID
export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await db.deleteUser(id);
        if (result) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};
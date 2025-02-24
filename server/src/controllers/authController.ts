import { Request, Response } from 'express';
import * as userService from '../services/userService';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    const newUser = await userService.createUser({ username, email, password });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await userService.getUserByEmail(email);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'JWT_SECRET',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export const generateToken = (payload: { id: number; email: string; role: UserRole }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
};


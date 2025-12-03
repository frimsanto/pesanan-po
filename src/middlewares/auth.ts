import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findActiveUserRoleByEmail, UserRoleRow } from '../models/userRoleModel';

export type AuthRole = 'admin' | 'super_admin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface JwtPayload {
  id: number;
  email: string;
  role: AuthRole;
  name: string;
}

export function signToken(user: UserRoleRow) {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cookieToken = (req as any).cookies?.auth_token as string | undefined;
    const header = req.headers.authorization;
    const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function authorize(roles: AuthRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    next();
  };
}

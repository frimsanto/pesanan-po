import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { findActiveUserRoleByEmail } from '../models/userRoleModel';
import { signToken } from '../middlewares/auth';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const user = await findActiveUserRoleByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = signToken(user);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd, // wajib true kalau SameSite 'none'
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 jam
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }

  return res.json({ success: true, data: req.user });
}

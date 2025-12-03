import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUserActive,
} from '../models/userRoleModel';

export async function listAdminUsersHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await listAdminUsers();
    const safe = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: !!u.is_active,
      created_at: u.created_at,
    }));
    res.json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
}

export async function createAdminUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: 'admin' | 'super_admin';
    };

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, email, password, role wajib diisi' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await createAdminUser({ name, email, password_hash, role });

    const safe = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: !!user.is_active,
      created_at: user.created_at,
    };

    res.status(201).json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
}

export async function toggleAdminUserActiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body as { is_active?: boolean };

    if (!id || typeof is_active === 'undefined') {
      return res.status(400).json({ success: false, message: 'id dan is_active wajib diisi' });
    }

    const user = await updateAdminUserActive(id, !!is_active);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const safe = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: !!user.is_active,
      created_at: user.created_at,
    };

    res.json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
}

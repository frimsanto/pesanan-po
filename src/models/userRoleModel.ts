import { pool } from '../config/db';

export interface UserRoleRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'super_admin';
  is_active: number;
  created_at: string;
}

export async function findActiveUserRoleByEmail(email: string): Promise<UserRoleRow | null> {
  const [rows] = await pool.query(
    'SELECT * FROM user_roles WHERE email = ? AND is_active = 1 LIMIT 1',
    [email],
  );

  const list = rows as UserRoleRow[];
  if (!list || list.length === 0) return null;
  return list[0];
}

export async function listAdminUsers(): Promise<UserRoleRow[]> {
  const [rows] = await pool.query('SELECT * FROM user_roles ORDER BY created_at DESC');
  return rows as UserRoleRow[];
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'super_admin';
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<UserRoleRow> {
  const [result] = await pool.query<{ insertId: number } & any>(
    'INSERT INTO user_roles (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
    [input.name, input.email, input.password_hash, input.role],
  );

  const insertId = (result as any).insertId as number;
  const [rows] = await pool.query('SELECT * FROM user_roles WHERE id = ?', [insertId]);
  const list = rows as UserRoleRow[];
  return list[0];
}

export async function updateAdminUserActive(id: number, isActive: boolean): Promise<UserRoleRow | null> {
  await pool.query('UPDATE user_roles SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  const [rows] = await pool.query('SELECT * FROM user_roles WHERE id = ?', [id]);
  const list = rows as UserRoleRow[];
  if (!list || list.length === 0) return null;
  return list[0];
}

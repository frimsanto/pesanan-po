import { pool } from "../config/db";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export async function getProducts(activeOnly: boolean): Promise<Product[]> {
  const [rows] = await pool.query(
    activeOnly
      ? "SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC"
      : "SELECT * FROM products ORDER BY created_at DESC"
  );
  return rows as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
  const list = rows as Product[];
  return list[0] || null;
}

export async function createProduct(
  data: Omit<Product, "id" | "created_at" | "updated_at">
): Promise<Product> {
  await pool.query(
    "INSERT INTO products (name, description, price, image_url, is_active) VALUES (?, ?, ?, ?, ?)",
    [
      data.name,
      data.description ?? null,
      data.price,
      data.image_url ?? null,
      data.is_active ?? 1,
    ]
  );

  const [rows] = await pool.query<Product[]>(
    "SELECT * FROM products ORDER BY created_at DESC LIMIT 1"
  );

  const created = rows[0];
  if (!created) {
    throw new Error("Failed to create product");
  }
  return created;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "created_at" | "updated_at">>
): Promise<Product | null> {
  const fields: string[] = [];
  const params: any[] = [];

  if (typeof updates.name !== "undefined") {
    fields.push("name = ?");
    params.push(updates.name);
  }
  if (typeof updates.description !== "undefined") {
    fields.push("description = ?");
    params.push(updates.description ?? null);
  }
  if (typeof updates.price !== "undefined") {
    fields.push("price = ?");
    params.push(updates.price);
  }
  if (typeof updates.image_url !== "undefined") {
    fields.push("image_url = ?");
    params.push(updates.image_url ?? null);
  }
  if (typeof updates.is_active !== "undefined") {
    fields.push("is_active = ?");
    params.push(updates.is_active);
  }

  if (!fields.length) {
    return await getProductById(id);
  }

  params.push(id);
  await pool.query(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, params);

  return await getProductById(id);
}

export async function deleteProduct(id: string): Promise<void> {
  await pool.query("DELETE FROM products WHERE id = ?", [id]);
}

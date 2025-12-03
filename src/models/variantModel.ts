import { pool } from "../config/db";

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  extra_price: number | null;
  is_active: number;
  created_at: Date | string;
}

export async function getVariantsByProduct(
  productId: string,
  activeOnly: boolean
): Promise<ProductVariant[]> {
  const [rows] = await pool.query(
    activeOnly
      ? "SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC"
      : "SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at ASC",
    [productId]
  );
  return rows as ProductVariant[];
}

export async function getVariantById(id: string): Promise<ProductVariant | null> {
  const [rows] = await pool.query("SELECT * FROM product_variants WHERE id = ?", [id]);
  const list = rows as ProductVariant[];
  return list[0] || null;
}

export async function createVariant(
  data: Omit<ProductVariant, "id" | "created_at">
): Promise<ProductVariant> {
  await pool.query(
    "INSERT INTO product_variants (product_id, name, extra_price, is_active) VALUES (?, ?, ?, ?)",
    [
      data.product_id,
      data.name,
      data.extra_price ?? 0,
      data.is_active ?? 1,
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at DESC LIMIT 1",
    [data.product_id]
  );

  const created = (rows as ProductVariant[])[0];
  if (!created) {
    throw new Error("Failed to create variant");
  }
  return created;
}

export async function updateVariant(
  id: string,
  updates: Partial<Omit<ProductVariant, "id" | "product_id" | "created_at">>
): Promise<ProductVariant | null> {
  const fields: string[] = [];
  const params: any[] = [];

  if (typeof updates.name !== "undefined") {
    fields.push("name = ?");
    params.push(updates.name);
  }
  if (typeof updates.extra_price !== "undefined") {
    fields.push("extra_price = ?");
    params.push(updates.extra_price);
  }
  if (typeof updates.is_active !== "undefined") {
    fields.push("is_active = ?");
    params.push(updates.is_active);
  }

  if (!fields.length) {
    return await getVariantById(id);
  }

  params.push(id);
  await pool.query(`UPDATE product_variants SET ${fields.join(", ")} WHERE id = ?`, params);

  return await getVariantById(id);
}

export async function deleteVariant(id: string): Promise<void> {
  await pool.query("DELETE FROM product_variants WHERE id = ?", [id]);
}

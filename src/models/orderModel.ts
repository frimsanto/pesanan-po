import { pool } from "../config/db";

export type OrderStatus = "pending" | "waiting_payment" | "confirmed" | "cancelled";

export interface Order {
  id: string;
  code: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string | null;
  status: OrderStatus;
  notes: string | null;
  admin_notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: Date | string;
}

export interface OrderItemWithRelations extends OrderItem {
  product_name: string | null;
  variant_name: string | null;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithRelations[];
}

export interface OrderFilters {
  status?: OrderStatus;
  productId?: string;
  variantId?: string;
  startDate?: string;
  endDate?: string;
}

export async function createOrder(
  data: Omit<Order, "id" | "code" | "status" | "admin_notes" | "created_at" | "updated_at"> & {
    status?: OrderStatus;
  }
): Promise<Order> {
  const [result] = await pool.query<{
    insertId: number;
  } & any>(
    "INSERT INTO orders (customer_name, customer_whatsapp, customer_email, notes, status) VALUES (?, ?, ?, ?, ?)",
    [
      data.customer_name,
      data.customer_whatsapp,
      data.customer_email ?? null,
      data.notes ?? null,
      data.status ?? "pending",
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM orders WHERE id = (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1)"
  );

  return (rows as Order[])[0];
}

export async function createOrderItems(
  items: Omit<OrderItem, "id" | "created_at">[]
): Promise<void> {
  if (!items.length) return;

  const values = items.map((i) => [
    i.order_id,
    i.product_id,
    i.variant_id ?? null,
    i.quantity,
    i.unit_price,
  ]);

  await pool.query(
    "INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price) VALUES ?",
    [values]
  );
}

export async function getOrderByIdWithItems(id: string): Promise<OrderWithItems | null> {
  const [orderRows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
  const order = (orderRows as Order[])[0];
  if (!order) return null;

  const [itemRows] = await pool.query(
    `SELECT
      oi.id,
      oi.order_id,
      oi.product_id,
      oi.variant_id,
      oi.quantity,
      oi.unit_price,
      oi.created_at,
      p.name as product_name,
      v.name as variant_name
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_variants v ON oi.variant_id = v.id
    WHERE oi.order_id = ?`,
    [id]
  );

  return {
    ...order,
    items: itemRows as OrderItemWithRelations[],
  };
}

export async function getOrderByCodePublic(code: string): Promise<
  Pick<Order, "code" | "customer_name" | "status" | "created_at">
  | null
> {
  const [rows] = await pool.query(
    "SELECT code, customer_name, status, created_at FROM orders WHERE code = ?",
    [code]
  );
  return (rows as Pick<Order, "code" | "customer_name" | "status" | "created_at">[])[0] ?? null;
}

export async function getOrdersWithTotals(filters: OrderFilters) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.status) {
    conditions.push("o.status = ?");
    params.push(filters.status);
  }

  if (filters.startDate) {
    conditions.push("o.created_at >= ?");
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push("o.created_at <= ?");
    params.push(filters.endDate);
  }

  if (filters.productId) {
    conditions.push("oi.product_id = ?");
    params.push(filters.productId);
  }

  if (filters.variantId) {
    conditions.push("oi.variant_id = ?");
    params.push(filters.variantId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query<any[]>(
    `SELECT
      o.*, 
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.created_at DESC`,
    params
  );

  return rows;
}

export async function updateOrder(
  id: string,
  updates: Partial<Pick<Order, "status" | "admin_notes" | "notes">>
): Promise<Order | null> {
  const fields: string[] = [];
  const params: any[] = [];

  if (typeof updates.status !== "undefined") {
    fields.push("status = ?");
    params.push(updates.status);
  }

  if (typeof updates.admin_notes !== "undefined") {
    fields.push("admin_notes = ?");
    params.push(updates.admin_notes ?? null);
  }

  if (typeof updates.notes !== "undefined") {
    fields.push("notes = ?");
    params.push(updates.notes ?? null);
  }

  if (!fields.length) {
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    return (rows as Order[])[0] ?? null;
  }

  params.push(id);

  await pool.query(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, params);

  const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
  return (rows as Order[])[0] ?? null;
}

export async function deleteOrder(id: string): Promise<void> {
  await pool.query("DELETE FROM orders WHERE id = ?", [id]);
}

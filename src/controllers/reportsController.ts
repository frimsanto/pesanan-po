import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

function buildDateFilter(start?: string, end?: string) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (start) {
    conditions.push('o.created_at >= ?');
    params.push(start);
  }
  if (end) {
    conditions.push('o.created_at <= ?');
    params.push(end);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

export async function summaryReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = req.query as { start?: string; end?: string };

    const { where, params } = buildDateFilter(start, end);

    const [raw] = await pool.query(
      `SELECT
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
        COALESCE(SUM(oi.quantity), 0) AS items_sold
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${where}`,
      params,
    );

    const rows = raw as {
      total_orders: number;
      total_revenue: number;
      items_sold: number;
    }[];

    const row = rows[0] || { total_orders: 0, total_revenue: 0, items_sold: 0 };

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function byVariantReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = req.query as { start?: string; end?: string };

    const { where, params } = buildDateFilter(start, end);

    const [raw] = await pool.query(
      `SELECT
        oi.variant_id,
        v.name AS variant_name,
        p.name AS product_name,
        COALESCE(SUM(oi.quantity), 0) AS qty_sold
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants v ON oi.variant_id = v.id
      LEFT JOIN products p ON oi.product_id = p.id
      ${where}
      GROUP BY oi.variant_id, v.name, p.name
      ORDER BY qty_sold DESC` ,
      params,
    );

    const rows = raw as {
      variant_id: string | null;
      variant_name: string | null;
      product_name: string | null;
      qty_sold: number;
    }[];

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function exportCsvReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end, type } = req.query as { start?: string; end?: string; type?: string };

    if (type !== 'summary' && type !== 'by-variant') {
      return res.status(400).json({ success: false, message: 'type harus "summary" atau "by-variant"' });
    }

    if (type === 'summary') {
      const { where, params } = buildDateFilter(start, end);
      const [raw] = await pool.query(
        `SELECT
          COUNT(DISTINCT o.id) AS total_orders,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
          COALESCE(SUM(oi.quantity), 0) AS items_sold
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        ${where}`,
        params,
      );

      const rows = raw as {
        total_orders: number;
        total_revenue: number;
        items_sold: number;
      }[];

      const r = rows[0] || { total_orders: 0, total_revenue: 0, items_sold: 0 };
      const csv = ['total_orders,total_revenue,items_sold', `${r.total_orders},${r.total_revenue},${r.items_sold}`].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="summary_report.csv"');
      return res.send(csv);
    }

    // by-variant
    const { where, params } = buildDateFilter(start, end);
    const [raw] = await pool.query(
      `SELECT
        oi.variant_id,
        v.name AS variant_name,
        p.name AS product_name,
        COALESCE(SUM(oi.quantity), 0) AS qty_sold
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants v ON oi.variant_id = v.id
      LEFT JOIN products p ON oi.product_id = p.id
      ${where}
      GROUP BY oi.variant_id, v.name, p.name
      ORDER BY qty_sold DESC` ,
      params,
    );

    const rows = raw as {
      variant_id: string | null;
      variant_name: string | null;
      product_name: string | null;
      qty_sold: number;
    }[];

    const header = 'variant_id,product_name,variant_name,qty_sold';
    const lines = rows.map((r) =>
      [r.variant_id ?? '', r.product_name ?? '', r.variant_name ?? '', r.qty_sold].join(','),
    );
    const csv = [header, ...lines].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="by_variant_report.csv"');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

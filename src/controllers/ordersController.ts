import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createOrder,
  createOrderItems,
  getOrderByIdWithItems,
  getOrdersWithTotals,
  getOrderByCodePublic,
  updateOrder as updateOrderModel,
  deleteOrder as deleteOrderModel,
  type OrderFilters,
} from "../models/orderModel";

const orderItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1).optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
});

const createOrderSchema = z.object({
  customer_name: z.string().min(1),
  customer_whatsapp: z.string().min(1),
  customer_email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1),
});

export async function createOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = createOrderSchema.parse(req.body);

    const order = await createOrder({
      customer_name: parsed.customer_name,
      customer_whatsapp: parsed.customer_whatsapp,
      customer_email: parsed.customer_email || null,
      notes: parsed.notes || null,
      status: "pending",
    });

    await createOrderItems(
      parsed.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    );

    const withItems = await getOrderByIdWithItems(order.id);

    res.status(201).json(withItems ?? order);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
}

export async function getOrderByCodePublicHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { code } = req.params;
    const order = await getOrderByCodePublic(code);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function listOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters: OrderFilters = {
      status: req.query.status as any,
      productId: req.query.productId as string | undefined,
      variantId: req.query.variantId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };

    const orders = await getOrdersWithTotals(filters);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const order = await getOrderByIdWithItems(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

const updateOrderSchema = z.object({
  status: z.enum(["pending", "waiting_payment", "confirmed", "cancelled"]).optional(),
  admin_notes: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function updateOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = updateOrderSchema.parse(req.body);
    const updated = await updateOrderModel(req.params.id, {
      status: parsed.status,
      admin_notes: parsed.admin_notes,
      notes: parsed.notes,
    });

    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
}

export async function deleteOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteOrderModel(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

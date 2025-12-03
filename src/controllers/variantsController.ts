import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createVariant,
  deleteVariant,
  getVariantById,
  getVariantsByProduct,
  updateVariant,
} from "../models/variantModel";

export async function listVariants(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = req.params.productId;
    const activeOnly = req.query.activeOnly !== "false";
    const variants = await getVariantsByProduct(productId, activeOnly);
    res.json(variants);
  } catch (err) {
    next(err);
  }
}

const variantSchema = z.object({
  product_id: z.string().min(1),
  name: z.string().min(1),
  extra_price: z.number().min(0).optional(),
  is_active: z.number().optional(),
});

export async function createVariantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = variantSchema.parse(req.body);
    const created = await createVariant({
      product_id: parsed.product_id,
      name: parsed.name,
      extra_price: typeof parsed.extra_price === "number" ? parsed.extra_price : 0,
      is_active: typeof parsed.is_active === "number" ? parsed.is_active : 1,
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
}

const updateVariantSchema = variantSchema.partial().omit({ id: true, product_id: true });

export async function updateVariantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateVariantSchema.parse(req.body);
    const updated = await updateVariant(req.params.id, {
      name: parsed.name,
      extra_price: parsed.extra_price,
      is_active: parsed.is_active,
    });

    if (!updated) {
      return res.status(404).json({ error: "Variant not found" });
    }

    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
}

export async function deleteVariantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteVariant(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

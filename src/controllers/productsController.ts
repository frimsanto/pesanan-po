import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from "../models/productModel";

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.activeOnly !== "false";
    const products = await getProducts(activeOnly);
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  price: z.number().min(0),
  image_url: z.string().url().optional().or(z.literal("")),
  is_active: z.number().optional(),
});

export async function createProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = productSchema.parse(req.body);
    const created = await createProduct({
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      image_url: parsed.image_url || null,
      is_active: typeof parsed.is_active === "number" ? parsed.is_active : 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
}

const updateProductSchema = productSchema.partial().omit({ id: true });

export async function updateProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateProductSchema.parse(req.body);
    const updated = await updateProduct(req.params.id, {
      name: parsed.name,
      description: parsed.description,
      price: parsed.price,
      image_url: parsed.image_url,
      is_active: parsed.is_active,
    });

    if (!updated) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
}

export async function deleteProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteProduct(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

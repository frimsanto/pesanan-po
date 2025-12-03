import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getSettings, updateSettings } from "../models/settingsModel";

const updateSettingsSchema = z.object({
  whatsapp_admin: z.string().optional(),
  po_start_date: z.string().optional(),
  po_end_date: z.string().optional(),
  terms: z.string().optional(),
  max_order_quantity: z.string().optional(),
  landing_logo_url: z.string().optional(),
  landing_brand_title: z.string().optional(),
  landing_brand_subtitle: z.string().optional(),
  landing_hero_title_line1: z.string().optional(),
  landing_hero_title_line2: z.string().optional(),
  landing_hero_description: z.string().optional(),
  landing_teaser_main_title: z.string().optional(),
  landing_teaser_main_subtitle: z.string().optional(),
  landing_teaser_col1_title: z.string().optional(),
  landing_teaser_col1_body: z.string().optional(),
  landing_teaser_col2_title: z.string().optional(),
  landing_teaser_col2_body: z.string().optional(),
});

export async function getSettingsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function updateSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = updateSettingsSchema.parse(req.body);
    await updateSettings(parsed);
    const settings = await getSettings();
    res.json(settings);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
}

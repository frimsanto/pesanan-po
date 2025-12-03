import { pool } from "../config/db";

export interface Settings {
  whatsapp_admin: string;
  po_start_date: string;
  po_end_date: string;
  terms: string;
  max_order_quantity: string;
  landing_logo_url: string;
  landing_brand_title: string;
  landing_brand_subtitle: string;
  landing_hero_title_line1: string;
  landing_hero_title_line2: string;
  landing_hero_description: string;
  landing_teaser_main_title: string;
  landing_teaser_main_subtitle: string;
  landing_teaser_col1_title: string;
  landing_teaser_col1_body: string;
  landing_teaser_col2_title: string;
  landing_teaser_col2_body: string;
}

export async function getSettings(): Promise<Settings> {
  const [rows] = await pool.query<any[]>("SELECT `key`, `value` FROM settings");

  const base: Settings = {
    whatsapp_admin: "",
    po_start_date: "",
    po_end_date: "",
    terms: "",
    max_order_quantity: "100",
    landing_logo_url: "",
    landing_brand_title: "DnF Pre-Order Hub",
    landing_brand_subtitle: "Bandeng & menu spesial pilihan",
    landing_hero_title_line1: "A Taste of Fresh",
    landing_hero_title_line2: "Bandeng & Topping Spesial",
    landing_hero_description:
      "Nikmati bandeng pilihan dengan racikan bumbu rumahan dan topping khas DnF. Stok terbatas setiap periode pre-order, pesan sekarang sebelum kehabisan.",
    landing_teaser_main_title: "Bandeng Utuh Bumbu Spesial",
    landing_teaser_main_subtitle: "Signature Dish",
    landing_teaser_col1_title: "Topping Tambahan",
    landing_teaser_col1_body:
      "Kombinasikan dengan topping favoritmu seperti tempe, tahu, atau nasi hangat.",
    landing_teaser_col2_title: "Pesan Sekali, Nikmati Ramai",
    landing_teaser_col2_body:
      "Cocok untuk keluarga, arisan, atau bekal acara spesial.",
  };

  for (const row of rows) {
    if (row.key in base) {
      (base as any)[row.key] = row.value ?? "";
    }
  }

  return base;
}

export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const entries = Object.entries(partial) as [keyof Settings, string][];

  for (const [key, value] of entries) {
    await pool.query("UPDATE settings SET value = ? WHERE `key` = ?", [value, key]);
  }
}

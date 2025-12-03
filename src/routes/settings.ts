import { Router } from "express";
import { getSettingsHandler, updateSettingsHandler } from "../controllers/settingsController";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// GET boleh digunakan FE tanpa login (untuk nomor WA, periode PO, dll)
router.get("/", getSettingsHandler);

// Update hanya boleh dilakukan super_admin
router.patch("/", authenticate, authorize(["super_admin"]), updateSettingsHandler);

export default router;

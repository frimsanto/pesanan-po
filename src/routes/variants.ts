import { Router } from "express";
import {
  createVariantHandler,
  deleteVariantHandler,
  listVariants,
  updateVariantHandler,
} from "../controllers/variantsController";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// Public: varian untuk landing page
router.get("/product/:productId", listVariants);

// Admin only: CRUD varian
router.post("/", authenticate, authorize(["admin", "super_admin"]), createVariantHandler);
router.patch("/:id", authenticate, authorize(["admin", "super_admin"]), updateVariantHandler);
router.delete("/:id", authenticate, authorize(["admin", "super_admin"]), deleteVariantHandler);

export default router;

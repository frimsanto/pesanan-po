import { Router } from "express";
import {
  createProductHandler,
  deleteProductHandler,
  getProduct,
  listProducts,
  updateProductHandler,
} from "../controllers/productsController";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// Public: digunakan landing page untuk menampilkan produk
router.get("/", listProducts);
router.get("/:id", getProduct);

// Admin only: CRUD produk
router.post("/", authenticate, authorize(["admin", "super_admin"]), createProductHandler);
router.patch("/:id", authenticate, authorize(["admin", "super_admin"]), updateProductHandler);
router.delete("/:id", authenticate, authorize(["admin", "super_admin"]), deleteProductHandler);

export default router;

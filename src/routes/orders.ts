import { Router } from "express";
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
  getOrderByCodePublicHandler,
} from "../controllers/ordersController";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// Public endpoint: digunakan oleh landing page untuk membuat pesanan
router.post("/", createOrderHandler);
router.get("/public/by-code/:code", getOrderByCodePublicHandler);

// Admin endpoints: perlu login admin/super_admin
router.get("/", authenticate, authorize(["admin", "super_admin"]), listOrdersHandler);
router.get("/:id", authenticate, authorize(["admin", "super_admin"]), getOrderHandler);
router.patch("/:id", authenticate, authorize(["admin", "super_admin"]), updateOrderHandler);
router.delete("/:id", authenticate, authorize(["admin", "super_admin"]), deleteOrderHandler);

export default router;

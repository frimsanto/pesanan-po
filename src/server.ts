import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import productsRouter from "./routes/products";
import variantsRouter from "./routes/variants";
import ordersRouter from "./routes/orders";
import settingsRouter from "./routes/settings";
import authRouter from "./routes/auth";
import adminUsersRouter from "./routes/adminUsers";
import reportsRouter from "./routes/reports";
import uploadsRouter from "./routes/uploads";
import path from "path";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8080";

const allowedOrigins = FRONTEND_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/variants", variantsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin", adminUsersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/uploads", uploadsRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

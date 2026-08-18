import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { connectToDatabase } from "../lib/db/connection";
import { verifySmtpConnection } from "./config/email";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import superAdminRoutes from "./routes/superAdminRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import contactRoutes from "./routes/contactRoutes";
import groupRoutes from "./routes/groupRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import messageRoutes from "./routes/messageRoutes";
import templateRoutes from "./routes/templateRoutes";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const normalizedClientUrl = rawClientUrl.replace(/\/+$/, "");

const allowedOrigins = new Set([
  normalizedClientUrl,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
]);

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.has(cleanOrigin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/sms", messageRoutes);
app.use("/api/templates", templateRoutes);

app.get("/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await connectToDatabase();

    // Verify SMTP connection on server startup without stopping server execution if unavailable
    await verifySmtpConnection();

    app.listen(PORT, () => {
      console.log(`🚀 Express server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;

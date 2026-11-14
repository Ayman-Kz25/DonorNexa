import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware, getAuth } from "@clerk/express";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import bloodRequestRoutes from "./routes/bloodRequestRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";

dotenv.config();

const app = express();

let dbConnectionPromise;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(clerkMiddleware());

// Ensure MongoDB is connected before handling API requests.
app.use(async (req, res, next) => {
  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDB().catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
    }

    await dbConnectionPromise;
    next();
  } catch (error) {
    console.error("Database connection error:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/cities", cityRoutes);

app.get("/", (req, res) => {
  res.send("DonorNexa API is running!");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DonorNexa API is running!",
  });
});

app.get("/api/protected", (req, res) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please sign in.",
    });
  }

  return res.json({
    success: true,
    message: "You are authenticated!",
    userId,
  });
});

export default app;

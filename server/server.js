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
import startExpirationJob from "./jobs/expireBloodRequests.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {});
  console.log(`Socket disconnected: ${socket.id}`);
});

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/users", userRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);

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

  res.json({
    success: true,
    message: "You are authenticated!",
    userId,
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startExpirationJob();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

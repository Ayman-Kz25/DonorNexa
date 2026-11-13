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
import startExpirationJob from "./jobs/expireBloodRequests.js";
import { setNotificationIO } from "./services/notificationService.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "@clerk/backend";
import User from "./models/User.js";

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
setNotificationIO(io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required."));
    }

    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const user = await User.findOne({
      clerkUserId: verifiedToken.sub,
      isActive: true,
    });

    if (!user) {
      return next(new Error("Active user account not found."));
    }

    socket.userId = user._id.toString();

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Invalid or expired authentication token."));
  }
});

io.on("connection", (socket) => {
  // Join only the authenticated user's private room.
  socket.join(`user:${socket.userId}`);

  console.log(`Socket connected for user: ${socket.userId}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(clerkMiddleware());

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

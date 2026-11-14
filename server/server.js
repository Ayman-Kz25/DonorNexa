import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "@clerk/backend";

import app from "./app.js";
import connectDB from "./config/db.js";
import startExpirationJob from "./jobs/expireBloodRequests.js";
import { setNotificationIO } from "./services/notificationService.js";
import User from "./models/User.js";

dotenv.config();

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
  socket.join(`user:${socket.userId}`);

  console.log(`Socket connected for user: ${socket.userId}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startExpirationJob();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

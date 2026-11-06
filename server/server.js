import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware, getAuth } from "@clerk/express";
import connectDB from "./config/db.js";
import userRoutes from './routes/userRoutes.js';
import donorRoutes from './routes/donorRoutes.js'

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use('/api/users', userRoutes);
app.use('/api/donors', donorRoutes);

app.get("/", (req, res) => {
  res.send("DonorNexa API is running!");
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DonorNexa API is running!',
  })
})

app.get('/api/protected', (req, res) => {
  const { isAuthenticated, userId } = getAuth(req)

  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please sign in.',
    })
  }

  res.json({
    success: true,
    message: 'You are authenticated!',
    userId,
  })
})

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

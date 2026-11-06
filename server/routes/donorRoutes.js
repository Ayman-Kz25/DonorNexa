import express from 'express';
import { createDonorProfile } from '../controllers/donorController.js';

const router = express.Router();

router.post('/profile', createDonorProfile);

export default router;
import express from 'express';
import { upload, uploadImage } from '../controllers/UploadController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Upload image (requires authentication)
router.post('/', authMiddleware, upload.single('image'), uploadImage);

export default router;

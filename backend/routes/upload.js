import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload image
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, 'items');

    res.json({
      message: 'Image uploaded successfully',
      url: imageUrl
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Server error during image upload' });
  }
});

export default router;
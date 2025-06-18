import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Create audit log
const createAuditLog = async (userId, action, details, req) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// Create notification
const createNotification = async (userId, message, type = 'info') => {
  try {
    await Notification.create({
      user: userId,
      message,
      type
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Create audit log
    await createAuditLog(user._id, 'USER_REGISTERED', 'User account created', req);

    // Create welcome notification
    await createNotification(user._id, 'Welcome to Marketbook&solution! Your account has been created successfully.', 'success');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Create audit log
    await createAuditLog(user._id, 'USER_LOGIN', 'User logged in', req);

    // Create notification
    await createNotification(user._id, 'You have successfully logged in to your account.', 'info');

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, avatar, billingAddress } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (billingAddress) updateData.billingAddress = billingAddress;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    // Create audit log
    await createAuditLog(user._id, 'PROFILE_UPDATED', 'User profile information updated', req);

    // Create notification
    await createNotification(user._id, 'Your profile has been updated successfully.', 'success');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Create audit log
    await createAuditLog(user._id, 'PASSWORD_CHANGED', 'User password changed', req);

    // Create notification
    await createNotification(user._id, 'Your password has been changed successfully.', 'success');

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    // Create audit log
    await createAuditLog(user._id, 'AVATAR_UPDATED', 'User avatar updated', req);

    // Create notification
    await createNotification(user._id, 'Your profile picture has been updated successfully.', 'success');

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error during avatar upload' });
  }
});

// Register as admin
router.post('/admin/register', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.isAdminRegistered) {
      return res.status(400).json({ message: 'Admin already registered for this account' });
    }

    // Generate unique admin pass
    const adminPass = crypto.randomBytes(16).toString('hex');

    user.adminPass = adminPass;
    user.isAdminRegistered = true;
    await user.save();

    // Create audit log
    await createAuditLog(user._id, 'ADMIN_REGISTERED', 'User registered as admin', req);

    // Create notification
    await createNotification(user._id, 'You have successfully registered as an admin. Your admin pass has been generated.', 'success');

    res.json({
      message: 'Admin registration successful',
      adminPass
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Server error during admin registration' });
  }
});

// Admin login
router.post('/admin/login', authenticateToken, async (req, res) => {
  try {
    const { adminPass } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.isAdminRegistered || user.adminPass !== adminPass) {
      return res.status(400).json({ message: 'Invalid admin pass' });
    }

    // Generate admin token
    const adminToken = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Create audit log
    await createAuditLog(user._id, 'ADMIN_LOGIN', 'User logged in as admin', req);

    // Create notification
    await createNotification(user._id, 'You have successfully logged in as an admin.', 'info');

    res.json({
      message: 'Admin login successful',
      adminToken
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

export default router;


// i want the name in this part of this code to be included to the below so the register name of the user doing the adding of the item will be included in the invoice const { name, email, password } = req.body;

// // Check if user already exists
// const existingUser = await User.findOne({ email });
// if (existingUser) {
//   return res.status(400).json({ message: 'User already exists with this email' });
// }

// // Create new user
// const user = new User({
//   name,
//   email,
//   password
// });
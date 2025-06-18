import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authenticateAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    await authenticateToken(req, res, () => {});

    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken) {
      return res.status(401).json({ message: 'Admin token required' });
    }

    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Invalid admin token' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid admin token' });
  }
};
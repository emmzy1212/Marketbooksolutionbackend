import express from 'express';
import Item from '../models/Item.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to check admin access
const checkAdminAccess = async (req, res, next) => {
  try {
    const adminToken = req.headers['x-admin-token'] || req.headers['authorization']?.split(' ')[1];
    
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

// Create audit log
const createAuditLog = async (userId, action, details, req, itemId = null) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      relatedItem: itemId
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// Create notification
const createNotification = async (userId, message, type = 'info', itemId = null) => {
  try {
    await Notification.create({
      user: userId,
      message,
      type,
      relatedItem: itemId
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Get admin stats
router.get('/stats', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get stats for current user's data only
    const totalItems = await Item.countDocuments({ user: userId });
    const totalUsers = 1; // Only the current user
    
    const items = await Item.find({ user: userId });
    const totalRevenue = items.reduce((sum, item) => sum + item.amount, 0);
    
    const recentActivity = await AuditLog.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalItems,
      totalUsers,
      totalRevenue,
      recentActivity
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error while fetching admin stats' });
  }
});

// Get all items (admin view)
router.get('/items', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // Only show items for the current user (admin can only manage their own data)
    const items = await Item.find({ user: req.user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    console.error('Get admin items error:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
});

// Delete item (admin)
router.delete('/items/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id // Admin can only delete their own items
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Create audit log
    await createAuditLog(req.user._id, 'ADMIN_ITEM_DELETED', `Admin deleted item: ${item.title}`, req, item._id);

    // Create notification
    await createNotification(req.user._id, `Item "${item.title}" has been deleted by admin.`, 'warning', item._id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Admin delete item error:', error);
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // Only show audit logs for the current user
    const logs = await AuditLog.find({ user: req.user._id })
      .populate('user', 'name email')
      .populate('relatedItem', 'title')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error while fetching audit logs' });
  }
});

// Get user activity summary
router.get('/user-activity', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get activity for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activity = await AuditLog.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            action: "$action"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    res.json({ activity });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error while fetching user activity' });
  }
});

export default router;
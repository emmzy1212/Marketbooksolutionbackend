import express from 'express';
import Item from '../models/Item.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateInvoicePDF } from '../utils/invoice.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

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

// Get all items for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user._id })
      .populate('user', 'name email billingAddress')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
});

// Get single item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email billingAddress');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ message: 'Server error while fetching item' });
  }
});

// Create new item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      status,
      image,
      customerEmail,
      customerName,
      customerAddress
    } = req.body;

    const item = new Item({
      title,
      description,
      amount,
      status,
      image,
      customerEmail,
      customerName,
      customerAddress,
      user: req.user._id
    });

    await item.save();
    await item.populate('user', 'name email billingAddress');

    await createAuditLog(req.user._id, 'ITEM_CREATED', `Created item: ${title} for customer: ${customerName}`, req, item._id);
    await createNotification(req.user._id, `New item "${title}" for ${customerName} has been created successfully.`, 'success', item._id);

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error while creating item' });
  }
});

// Update item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      status,
      image,
      customerEmail,
      customerName,
      customerAddress
    } = req.body;

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, description, amount, status, image, customerEmail, customerName, customerAddress },
      { new: true, runValidators: true }
    ).populate('user', 'name email billingAddress');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await createAuditLog(req.user._id, 'ITEM_UPDATED', `Updated item: ${title} for customer: ${customerName}`, req, item._id);
    await createNotification(req.user._id, `Item "${title}" updated for ${customerName}.`, 'success', item._id);

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error while updating item' });
  }
});

// Delete item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await createAuditLog(req.user._id, 'ITEM_DELETED', `Deleted item: ${item.title} for customer: ${item.customerName}`, req, item._id);
    await createNotification(req.user._id, `Item "${item.title}" for ${item.customerName} has been deleted.`, 'info', item._id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

// Generate invoice
router.post('/:id/invoice', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email billingAddress');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const invoiceUrl = await generateInvoicePDF(item);

    await createAuditLog(req.user._id, 'INVOICE_GENERATED', `Generated invoice for item: ${item.title} for customer: ${item.customerName}`, req, item._id);
    await createNotification(req.user._id, `Invoice generated for "${item.title}" for ${item.customerName}.`, 'success', item._id);

    res.json({
      message: 'Invoice generated successfully',
      invoiceUrl
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ message: 'Server error while generating invoice' });
  }
});

// Send email with PDF invoice attachment
router.post('/:id/send-email', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email billingAddress');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.customerEmail) {
      return res.status(400).json({ message: 'Customer email is required' });
    }

    // Generate PDF as base64 data URL
    const invoiceDataUrl = await generateInvoicePDF(item);

    // Extract base64 content by removing prefix "data:application/pdf;base64,"
    const base64Content = invoiceDataUrl.split(',')[1];

    await sendEmail({
      to: item.customerEmail,
      subject: `Invoice for ${item.title}`,
      html: `
        <h2>Invoice from ${item.user.name}</h2>
        <p>Dear ${item.customerName},</p>
        <p>Please find attached the invoice for your recent purchase.</p>
        <p><strong>Item:</strong> ${item.title}</p>
        <p><strong>Amount:</strong> ₦${item.amount.toFixed(2)}</p>
        <p><strong>Status:</strong> ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</p>
        <p><strong>Customer Address:</strong> ${item.customerAddress || 'N/A'}</p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>${item.user.name}</p>
      `,
      attachments: [
        {
          filename: `invoice-${item._id}.pdf`,
          content: base64Content,
          encoding: 'base64'
        }
      ]
    });

    await createAuditLog(req.user._id, 'EMAIL_SENT', `Sent invoice for item: ${item.title} to ${item.customerEmail}`, req, item._id);
    await createNotification(req.user._id, `Invoice email sent to ${item.customerEmail} for "${item.title}".`, 'success', item._id);

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Server error while sending email' });
  }
});

export default router;

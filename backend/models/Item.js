import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'pending'],
    default: 'pending'
  },
  image: {
    type: String,
    default: ''
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerName: {
    type: String,
    required: false
  },
  customerAddress: {
    type: String,
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Item', itemSchema);
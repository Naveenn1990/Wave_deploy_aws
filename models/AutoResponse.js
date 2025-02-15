const mongoose = require('mongoose');

const autoResponseSchema = new mongoose.Schema({
  issueType: {
    type: String,
    required: true,
    unique: true
  },
  response: {
    type: String,
    required: true
  },
  suggestedActions: [{
    type: String
  }],
  keywords: [{
    type: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
autoResponseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better search performance
autoResponseSchema.index({ issueType: 1, category: 1 });
autoResponseSchema.index({ keywords: 1 });

module.exports = mongoose.model('AutoResponse', autoResponseSchema);

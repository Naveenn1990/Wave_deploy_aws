const mongoose = require('mongoose');

const supportSettingsSchema = new mongoose.Schema({
  responseTimeLimit: {
    type: Number,
    required: true,
    default: 24 // hours
  },
  escalationTimeLimit: {
    type: Number,
    required: true,
    default: 48 // hours
  },
  supportCategories: [{
    name: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    responseTimeLimit: {
      type: Number // Override default response time for specific categories
    }
  }],
  autoResponseEnabled: {
    type: Boolean,
    default: true
  },
  autoResponseMessage: {
    type: String,
    default: 'Thank you for contacting Wave support. We have received your request and will get back to you within 24 hours.'
  },
  supportHours: {
    weekdays: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      }
    },
    weekends: {
      start: {
        type: String,
        default: '10:00'
      },
      end: {
        type: String,
        default: '16:00'
      }
    }
  },
  holidays: [{
    date: Date,
    description: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('SupportSettings', supportSettingsSchema);

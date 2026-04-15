const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String, // URL or path to the icon
        required: true
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
    },
    subServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubService' }], // ✅ Ensure this field exists

    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;

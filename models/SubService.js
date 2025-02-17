const mongoose = require('mongoose');

const subServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        type: String // Array of URLs or paths to images
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SubService = mongoose.model('SubService', subServiceSchema);

module.exports = SubService;

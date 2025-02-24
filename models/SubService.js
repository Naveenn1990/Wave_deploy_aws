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
    subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory', 
    },
    price: {
        type: Number,
        required: true
    },
    icon: [{
        type: String // Array of URLs or paths to images
    }],
    includes: {
        type: [String], // Array of strings to list included features
        default: [],
    },
    excludes: {
        type: [String], // Array of strings to list excluded features
        default: [],
    },
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

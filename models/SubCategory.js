const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ServiceCategory',
        required: true 
    },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    subservices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubService' }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;

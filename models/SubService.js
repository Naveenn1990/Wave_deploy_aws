const mongoose = require('mongoose');

const subServiceSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    basePrice: { type: Number },
    gst: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    icon: [{ type: String }],
    includes: { type: [String], default: [] },
    excludes: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    rating: { type: Number, default: 0 }
});

// Pre-save hook to calculate basePrice
subServiceSchema.pre('save', function (next) {
    this.basePrice = this.mrp - (this.mrp * this.discount / 100);
    next();
});

const SubService = mongoose.model('SubService', subServiceSchema);

module.exports = SubService;

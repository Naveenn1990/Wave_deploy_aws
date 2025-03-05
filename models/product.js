const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Store category ID
    brand: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    specifications: { type: String, required: true },
    howToUse: { type: String, required: true },
    image: { type: String, required: true },
    hsnCode: { type: String, required: true }, // New field: HSN Code
    gstPercentage: { type: Number, required: true }, // New field: GST %
    discountPercentage: { type: Number, required: true, default: 0 }, // New field: Discount %
    model: { type: String, required: true } // New field: Product Model
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

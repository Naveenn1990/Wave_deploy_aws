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
    image: { type: String, required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

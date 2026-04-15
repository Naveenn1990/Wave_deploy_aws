const mongoose = require('mongoose');

const promoVideoSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    }, 
}, {
    timestamps: true
});

module.exports = mongoose.model('PromoVideo', promoVideoSchema);

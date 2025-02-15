const mongoose = require('mongoose');

const promotionalBannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    link: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const PromotionalBanner = mongoose.model('PromotionalBanner', promotionalBannerSchema);

module.exports = PromotionalBanner;

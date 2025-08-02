const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
        max: 100 // Assuming discount is a percentage
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    promotionalImage: {
        type: String, // URL or path to the image
        required: true
    },
    offerTitle: {
        type: String,
        required: true
    },
    applyOffer:[{
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);

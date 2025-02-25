const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // booking: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Booking', // Reference to the Booking model
    //     required: true
    // },
    subService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubService',
        required: true
    },
    // partner: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Partner',
    //     required: true
    // },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

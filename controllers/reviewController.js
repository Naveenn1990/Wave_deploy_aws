const Review = require('../models/Review');
const User = require('../models/User');
const Booking = require('../models/booking');

// Submit a new review
exports.submitReview = async (req, res) => {
    const { user, booking, rating, comment } = req.body;
    try {
        const review = new Review({ user, booking, rating, comment });
        await review.save();
        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        res.status(400).json({ message: 'Error submitting review', error: error.message });
    }
};

// Get reviews for a specific booking
exports.getReviews = async (req, res) => {
    const { bookingId } = req.params;
    try {
        const reviews = await Review.find({ booking: bookingId }).populate('user', 'name');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving reviews', error: error.message });
    }
};

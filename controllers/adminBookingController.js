const Booking = require('../models/booking');  // Make sure this path is correct

// Get all bookings for admin
exports.getAllBookings = async (req, res) => {
    try {
        console.log('getAllBookings controller called'); // Debug log

        const bookings = await Booking.find();
        console.log('Raw bookings found:', bookings.length); // Debug log

        const populatedBookings = await Booking.find()
            .populate('user', 'name email phone')
            .populate('category', 'name description')
            .populate('service', 'name description basePrice duration')
            .sort({ createdAt: -1 });

        console.log('Populated bookings:', populatedBookings.length); // Debug log

        const formattedBookings = populatedBookings.map(booking => ({
            _id: booking._id,
            customerName: booking.user?.name || 'N/A',
            customerEmail: booking.user?.email || 'N/A',
            customerPhone: booking.user?.phone || 'N/A',
            serviceName: booking.service?.name || 'N/A',
            categoryName: booking.category?.name || 'N/A',
            amount: booking.amount || 0,
            status: booking.status || 'N/A',
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.scheduledTime,
            location: {
                address: booking.location?.address || 'N/A',
                landmark: booking.location?.landmark || 'N/A',
                pincode: booking.location?.pincode || 'N/A'
            },
            createdAt: booking.createdAt
        }));

        console.log('Formatted bookings:', formattedBookings.length); // Debug log

        return res.status(200).json({
            success: true,
            count: formattedBookings.length,
            data: formattedBookings
        });

    } catch (error) {
        console.error('Admin Get All Bookings Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
}; 
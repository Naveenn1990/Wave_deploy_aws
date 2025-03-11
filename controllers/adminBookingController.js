const Booking = require('../models/booking');  // Make sure this path is correct

exports.getAllBookings = async (req, res) => {
    try {
        console.log('getAllBookings controller called'); // Debug log

        // Fetch all bookings with correct population hierarchy, including the partner
        const bookings = await Booking.find()
            .populate('user', 'name email phone') // Populate user details
            .populate({
                path: 'partner',
                // select: 'name _id email phone address' // Include full partner details
            })
            .populate({
                path: 'subService',
                populate: {
                    path: 'service', // SubService → Service
                    populate: {
                        path: 'subCategory', // Service → SubCategory
                        populate: {
                            path: 'category', // SubCategory → ServiceCategory
                            select: 'name description'
                        }
                    }
                }
            })
            .sort({ createdAt: -1 })
            .lean(); // Convert to plain JS objects for better performance

        console.log('Raw bookings found:', bookings.length); // Debug log

        // Format the response
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            customerName: booking.user?.name || 'N/A',
            customerEmail: booking.user?.email || 'N/A',
            customerPhone: booking.user?.phone || 'N/A',
            serviceName: booking.subService?.service?.name || 'N/A',
            categoryName: booking.subService?.service?.subCategory?.category?.name || 'N/A',
            partnerId: booking.partner?._id || 'N/A',
            partnerName: booking.partner?.name || (booking.partner ? 'Still not assigned' : 'N/A'), // Handle unassigned partners
            partnerEmail: booking.partner?.email || 'N/A',
            partnerPhone: booking.partner?.phone || 'N/A',
            partnerAddress: booking.partner?.address || 'N/A',
            amount: booking.amount || 0,
            paymentMode: booking.paymentMode || 'N/A', // Include payment mode
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

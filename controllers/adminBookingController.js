const Booking = require('../models/booking');  // Make sure this path is correct

exports.getAllBookings = async (req, res) => {
    try {
        console.log('getAllBookings controller called');

        const bookings = await Booking.find()
            .populate('user', 'name email phone')
            .populate({
                path: 'partner',
                select: '_id profile.phone profile.email profile.name profile.address' // Corrected partner population
            })
            .populate({
                path: 'subService',
                populate: {
                    path: 'service',
                    populate: {
                        path: 'subCategory',
                        populate: {
                            path: 'category',
                            select: 'name description'
                        }
                    }
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        console.log('Raw bookings found:', bookings.length);

        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            customerName: booking.user?.name || 'N/A',
            customerEmail: booking.user?.email || 'N/A',
            customerPhone: booking.user?.phone || 'N/A',
            serviceName: booking.subService?.service?.name || 'N/A',
            categoryName: booking.subService?.service?.subCategory?.category?.name || 'N/A',
            partnerId: booking.partner?._id || 'N/A',
            partnerName: booking.partner?.profile?.name || 'Still not assigned',
            partnerEmail: booking.partner?.profile?.email || 'N/A',
            partnerPhone: booking.partner?.profile?.phone || 'N/A',
            partnerAddress: booking.partner?.profile?.address || 'N/A',
            amount: booking.amount || 0,
            paymentMode: booking.paymentMode || 'N/A',
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

        console.log('Formatted bookings:', formattedBookings.length);

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

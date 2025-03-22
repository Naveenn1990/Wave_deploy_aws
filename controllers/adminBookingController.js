const Booking = require('../models/booking');  // Make sure this path is correct

exports.getAllBookings = async (req, res) => {
    try {
        console.log('getAllBookings controller called');

        // Step 1: Aggregate monthly booking counts
        const monthlyCounts = await Booking.aggregate([
            {
                $group: {
                    _id: { 
                        year: { $year: "$createdAt" }, 
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { 
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Step 2: Format the monthly data
        const monthWiseBookingCount = {};
        monthlyCounts.forEach(entry => {
            const monthName = new Date(entry._id.year, entry._id.month - 1)
                .toLocaleString('default', { month: 'long' });
            monthWiseBookingCount[`${monthName} ${entry._id.year}`] = entry.count;
        });

        // Step 3: Fetch all bookings
        const bookings = await Booking.find()
            .populate('user', 'name email phone')
            .populate({
                path: 'partner',
                select: '_id profile.phone profile.email profile.name profile.address'
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

        // Step 4: Format the bookings
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
            partnerProfilePicture: booking.partner?.profilePicture || 'N/A',
            amount: booking.amount || 0,
            paymentMode: booking.paymentMode || 'N/A',
            status: booking.status || 'N/A',
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.scheduledTime,
            chat: booking.chat,
            booking,
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
            monthlyBookingCount: monthWiseBookingCount,
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

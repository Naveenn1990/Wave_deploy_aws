const Booking = require('../models/booking');  // Make sure this path is correct
const User = require('../models/User');
const SubService = require('../models/SubService');

exports.getAllBookings = async (req, res) => {
    try {
        console.log('getAllBookings controller called');

        // Extract pagination parameters
        const {
            page = 1,
            limit = 10,
            status,
            fromDate,
            toDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Convert to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query for filtering
        const query = {};
        
        // Add status filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Add date range filter
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                query.createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.createdAt.$lte = new Date(toDate);
            }
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Step 1: Get total count for pagination
        const total = await Booking.countDocuments(query);

        // Step 2: Aggregate monthly booking counts (for analytics)
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

        // Step 3: Format the monthly data
        const monthWiseBookingCount = {};
        monthlyCounts.forEach(entry => {
            const monthName = new Date(entry._id.year, entry._id.month - 1)
                .toLocaleString('default', { month: 'long' });
            monthWiseBookingCount[`${monthName} ${entry._id.year}`] = entry.count;
        });

        // Step 4: Fetch bookings with pagination
        const bookings = await Booking.find(query)
            .populate({
                path: "user", // Populate user details
                select: 'name email phone profilePicture addresses'
            })
            .populate({
                path: "subService",
                populate: {
                    path: "service", // SubService -> Service
                    populate: {
                        path: "subCategory", // Service -> SubCategory
                        populate: {
                            path: "category", // SubCategory -> ServiceCategory
                            select: "name",
                        },
                    },
                },
            })
            .populate({
                path: "partner", // Populate partner details
                select: 'profile.name profile.email profile.phone profilePicture'
            })
            .populate({
                path: "cart.product", // Populate product details inside cart
            })
            .populate({
                path: "cart.addedByPartner", // Populate partner who added the product
                select: "profile.name profile.email", // Select specific fields
            })
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(); // Convert to plain JS objects for better performance

        // Step 5: Format the bookings
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            booking: {
                ...booking,
                // Explicitly include media and review fields
                photos: booking.photos || [],
                videos: booking.videos || [],
                afterPhotos: booking.afterPhotos || [],
                afterVideos: booking.afterVideos || [],
                review: booking.review || null,
                quotation: booking.quotation || null,
                cart: booking.cart || [],
                otp: booking.otp || null,
                otpActive: booking.otpActive || false,
                otpGeneratedAt: booking.otpGeneratedAt || null,
                acceptedAt: booking.acceptedAt || null,
                completedAt: booking.completedAt || null,
                rideStart: booking.rideStart || false,
                currentBooking: booking.currentBooking || false,
                pauseDetails: booking.pauseDetails || null,
                cancellationReason: booking.cancellationReason || null,
                cancellationTime: booking.cancellationTime || null,
                subService: booking.subService,
                payamount: booking.payamount || 0,
                discount: booking.discount || 0,
                tax: booking.tax || 0,
                usewallet: booking.usewallet || 0,
                lat: booking.lat || null,
                lng: booking.lng || null
            },
            customerName: booking.user?.name || 'N/A',
            customerEmail: booking.user?.email || 'N/A',
            customerPhone: booking.user?.phone || 'N/A',
            serviceName: booking.subService?.service?.name || 'N/A',
            categoryName: booking.subService?.service?.subCategory?.category?.name || 'N/A',
            partner: booking.partner,
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
            chat: booking.chat || [],
            location: {
                address: booking.location?.address || 'N/A',
                landmark: booking.location?.landmark || 'N/A',
                pincode: booking.location?.pincode || 'N/A'
            },
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        }));

        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        console.log('Formatted bookings:', formattedBookings.length);

        return res.status(200).json({
            success: true,
            monthlyBookingCount: monthWiseBookingCount,
            count: formattedBookings.length,
            data: formattedBookings,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage,
                hasPrevPage,
                startIndex: skip + 1,
                endIndex: Math.min(skip + limitNum, total)
            }
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

// Create manual booking by admin
exports.createManualBooking = async (req, res) => {
    try {
        console.log('Create manual booking called');
        console.log('Request body:', req.body);

        const {
            userId,
            customerName,
            customerPhone,
            customerEmail,
            isNewCustomer,
            serviceName,
            subServiceName,
            amount,
            scheduledDate,
            scheduledTime,
            location,
            paymentMode,
            status
        } = req.body;

        // Validate required fields
        if (!customerName || !customerPhone || !serviceName || !amount || 
            !scheduledDate || !scheduledTime || !location || !paymentMode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate location
        if (!location.address || !location.pincode) {
            return res.status(400).json({
                success: false,
                message: 'Location address and pincode are required'
            });
        }

        let user;

        // Handle new customer creation or existing user
        if (isNewCustomer) {
            // Check if user with this phone already exists
            const existingUser = await User.findOne({ phone: customerPhone });
            
            if (existingUser) {
                user = existingUser;
            } else {
                // Create new user
                user = await User.create({
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail || '',
                    isVerified: true,
                    isProfileComplete: true,
                    status: 'active'
                });
                console.log('New user created:', user._id);
            }
        } else {
            // Use existing user
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required for existing customer'
                });
            }
            
            user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
        }

        // Try to find the subService by name
        let subService = null;
        if (subServiceName && subServiceName !== "N/A") {
            subService = await SubService.findOne({ name: subServiceName });
        }

        // If no subService found, try to find any subService to satisfy the required field
        // This is a workaround for manual bookings where subService might not be specified
        if (!subService) {
            // Get the first available subService as a placeholder
            subService = await SubService.findOne();
            
            if (!subService) {
                return res.status(400).json({
                    success: false,
                    message: 'No sub-service found. Please ensure at least one sub-service exists in the system.'
                });
            }
        }

        // Create booking
        const booking = await Booking.create({
            user: user._id,
            subService: subService._id,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            location: {
                address: location.address,
                landmark: location.landmark || '',
                pincode: location.pincode
            },
            amount: parseFloat(amount),
            paymentMode,
            status: status || 'pending',
            paymentStatus: paymentMode === 'cash' ? 'pending' : 'completed',
            currentBooking: false
        });

        console.log('Booking created:', booking._id);

        // Populate the booking with user details
        const populatedBooking = await Booking.findById(booking._id)
            .populate('user', 'name email phone')
            .populate('subService');

        return res.status(201).json({
            success: true,
            message: 'Manual booking created successfully',
            data: populatedBooking
        });

    } catch (error) {
        console.error('Create Manual Booking Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating manual booking',
            error: error.message
        });
    }
};

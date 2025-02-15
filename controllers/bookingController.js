const Booking = require("../models/booking");
const Service = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");
const User = require("../models/User"); // Added User model
const mongoose = require('mongoose');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    console.log("Create Booking - Request Body:", req.body);

    const { categoryId, serviceId, scheduledDate, scheduledTime, location, userId } = req.body;

    // Validate required fields
    if (!categoryId || !serviceId || !scheduledDate || !scheduledTime || !location || !userId) {
      console.log("Missing required fields:", { categoryId, serviceId, scheduledDate, scheduledTime, location, userId });
      return res.status(400).json({
        success: false,
        message: "Missing required fields. categoryId, serviceId, scheduledDate, scheduledTime, location, and userId are required",
      });
    }

    // Check if userId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user ID format:", userId);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Check if categoryId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.log("Invalid category ID format:", categoryId);
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }

    // Check if serviceId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      console.log("Invalid service ID format:", serviceId);
      return res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
    }

    // Validate location
    if (!location.address || !location.pincode) {
      console.log("Invalid location:", location);
      return res.status(400).json({
        success: false,
        message: "Address and pincode are required in location",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // First check if category exists and is active
    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      console.log("Category not found:", categoryId);
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.status !== "active") {
      console.log("Category is inactive:", category);
      return res.status(400).json({
        success: false,
        message: "Category is not active",
      });
    }

    // Then check if service exists and belongs to this category
    const service = await Service.findOne({
      _id: serviceId,
      category: categoryId
    });

    if (!service) {
      console.log("Service not found or doesn't belong to category:", { serviceId, categoryId });
      return res.status(404).json({
        success: false,
        message: "Service not found or doesn't belong to the specified category",
      });
    }

    if (!service.isActive) {
      console.log("Service is inactive:", service);
      return res.status(400).json({
        success: false,
        message: "Service is currently inactive",
      });
    }

    // Validate scheduled date is in the future
    const bookingDate = new Date(scheduledDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for date comparison
    
    if (bookingDate < now) {
      console.log("Invalid booking date:", { bookingDate, now });
      return res.status(400).json({
        success: false,
        message: "Scheduled date must be in the future",
      });
    }

    // Create the booking
    const booking = new Booking({
      user: userId,
      category: categoryId,
      service: serviceId,
      scheduledDate: bookingDate,
      scheduledTime,
      location: {
        address: location.address,
        landmark: location.landmark || "",
        pincode: location.pincode
      },
      amount: service.basePrice,
      status: 'pending'
    });

    await booking.save();

    // Populate the booking with category and service details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('category', 'name description')
      .populate('service', 'name description basePrice duration')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: populatedBooking
    });

  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating booking"
    });
  }
};

// Get all bookings without pagination
exports.getAllBookings = async (req, res) => {
  try {
    // Get all bookings with populated service and category details
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service', 'name description basePrice duration')
      .populate('category', 'name description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error("Error in getAllBookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message
    });
  }
};

// Get all bookings (with filters and pagination)
exports.getAllBookingsWithFilters = async (req, res) => {
  try {
    const { 
      status, 
      fromDate, 
      toDate, 
      page = 1, 
      limit = 10,
      sortBy = 'scheduledDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add date range filter
    if (fromDate || toDate) {
      query.scheduledDate = {};
      if (fromDate) {
        query.scheduledDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.scheduledDate.$lte = new Date(toDate);
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate({
        path: 'service',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .populate('user', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllBookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all bookings",
      error: error.message,
    });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate({
        path: 'service',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getUserBookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user bookings",
      error: error.message,
    });
  }
};

// Get booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    }).populate({
      path: 'service',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error in getBookingDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking details",
      error: error.message,
    });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { scheduledDate, scheduledTime, location } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update booking that is in progress, completed, or cancelled",
      });
    }

    // Validate scheduled date is in the future
    if (scheduledDate) {
      const newBookingDate = new Date(scheduledDate);
      if (newBookingDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Scheduled date must be in the future",
        });
      }
      booking.scheduledDate = newBookingDate;
    }

    // Update fields if provided
    if (scheduledTime) booking.scheduledTime = scheduledTime;
    if (location) {
      if (!location.address || !location.pincode) {
        return res.status(400).json({
          success: false,
          message: "Address and pincode are required in location",
        });
      }
      booking.location = location;
    }

    await booking.save();
    await booking.populate({
      path: 'service',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error in updateBooking:", error);
    res.status(500).json({
      success: false,
      message: "Error updating booking",
      error: error.message,
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (["completed", "in_progress"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed or in-progress booking",
      });
    }

    booking.status = "cancelled";
    booking.cancellationReason = cancellationReason;
    booking.cancellationTime = new Date();

    await booking.save();
    await booking.populate({
      path: 'service',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      error: error.message,
    });
  }
};

// Add review
exports.addReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating is required and must be between 1 and 5",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed bookings",
      });
    }

    if (booking.review) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this booking",
      });
    }

    booking.review = {
      rating,
      comment,
      createdAt: new Date(),
    };

    await booking.save();
    await booking.populate({
      path: 'service',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error in addReview:", error);
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message,
    });
  }
};

// Get all bookings for a user with pagination
exports.getUserBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // Optional status filter
    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    // Get bookings with populated service and category details
    const bookings = await Booking.find(query)
      .populate('service', 'name description basePrice duration')
      .populate('category', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error("Error in getUserBookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message
    });
  }
};

// Get a specific booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id
    })
    .populate('service', 'name description basePrice duration')
    .populate('category', 'name description');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error("Error in getBookingById:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error.message
    });
  }
};

// Get bookings by status
exports.getBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate status
    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", ")
      });
    }

    const query = {
      user: req.user._id,
      status: status
    };

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    // Get bookings
    const bookings = await Booking.find(query)
      .populate('service', 'name description basePrice duration')
      .populate('category', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error("Error in getBookingsByStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message
    });
  }
};

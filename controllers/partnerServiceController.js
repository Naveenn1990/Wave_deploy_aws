const PartnerService = require("../models/PartnerService");
const ServiceCategory = require("../models/ServiceCategory");
const Partner = require("../models/Partner");
const Booking = require("../models/booking");
const PartnerProfile = require("../models/PartnerProfile");
const jwt = require('jsonwebtoken');
const SubService = require('../models/SubService');

// Get all available services for partners
exports.getAvailableServices = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ status: "active" })
      .select("name description icon services")
      .where("services.status")
      .equals("active");

    res.json(categories);
  } catch (error) {
    console.error("Get Available Services Error:", error);
    res.status(500).json({ message: "Error fetching available services" });
  }
};

// Select services by partner
exports.selectService = async (req, res) => {
  try {
    const { categoryId, serviceId } = req.params;
    const { price, experience, certificates, availability } = req.body;

    // 1. Validate partner status
    if (req.partner.status !== 'approved' || req.partner.kycStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: "Complete profile approval and KYC verification first"
      });
    }

    // 2. Check for ongoing services
    const ongoingService = await PartnerService.findOne({
      partner: req.partner._id,
      status: { 
        $in: ['active', 'in_progress'] 
      }
    });

    if (ongoingService) {
      return res.status(400).json({
        success: false,
        message: "Please complete your ongoing service before selecting a new one",
        currentService: {
          category: ongoingService.category,
          service: ongoingService.service,
          status: ongoingService.status
        }
      });
    }

    // 3. Validate required fields
    if (!price || !experience) {
      return res.status(400).json({
        success: false,
        message: "Price and experience are required"
      });
    }

    // 4. Check if service exists
    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const service = category.services.id(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // 5. Validate price against base price
    if (price < service.basePrice) {
      return res.status(400).json({
        success: false,
        message: `Price must be at least ${service.basePrice}`
      });
    }

    // 6. Create new partner service
    const partnerService = new PartnerService({
      partner: req.partner._id,
      category: categoryId,
      service: serviceId,
      price,
      experience,
      certificates: certificates || [],
      status: 'active', // Initial status
      availability: availability || {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timeSlots: [{ start: "09:00", end: "18:00" }]
      }
    });

    await partnerService.save();

    res.json({
      success: true,
      message: "Service selected successfully",
      service: partnerService
    });
  } catch (error) {
    console.error("Select Service Error:", error);
    res.status(500).json({
      success: false,
      message: "Error selecting service"
    });
  }
};

// Get partner's selected services
exports.getMyServices = async (req, res) => {
  try {
    const services = await PartnerService.find({ partner: req.partner._id })
      .populate("category", "name description")
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error("Get My Services Error:", error);
    res.status(500).json({ message: "Error fetching your services" });
  }
};

// Update partner service
exports.updateMyService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;

    const service = await PartnerService.findOne({
      _id: serviceId,
      partner: req.partner._id,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // If price is being updated, validate against base price
    if (updates.price) {
      const category = await ServiceCategory.findById(service.category);
      const baseService = category.services.id(service.service);

      if (updates.price < baseService.basePrice) {
        return res.status(400).json({
          message: `Price cannot be less than base price of ${baseService.basePrice}`,
        });
      }
    }

    Object.assign(service, updates);
    await service.save();

    res.json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Update Service Error:", error);
    res.status(500).json({ message: "Error updating service" });
  }
};

// Toggle service status (active/inactive)
exports.toggleServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const service = await PartnerService.findOne({
      _id: serviceId,
      partner: req.partner._id,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.status = status;
    await service.save();

    res.json({
      message: `Service ${
        status === "active" ? "activated" : "deactivated"
      } successfully`,
      service,
    });
  } catch (error) {
    console.error("Toggle Service Status Error:", error);
    res.status(500).json({ message: "Error updating service status" });
  }
};

// Add a helper function to get partner's current service status
exports.getCurrentService = async (req, res) => {
  try {
    const currentService = await PartnerService.findOne({
      partner: req.partner._id,
      status: { 
        $in: ['active', 'in_progress'] 
      }
    }).populate('category service');

    if (!currentService) {
      return res.json({
        success: true,
        message: "No active services found",
        canSelectNew: true
      });
    }

    res.json({
      success: true,
      currentService,
      canSelectNew: false
    });
  } catch (error) {
    console.error("Get Current Service Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching current service"
    });
  }
};

// Get service history
exports.getServiceHistory = async (req, res) => {
  try {
    const services = await PartnerService.find({
      partner: req.partner._id,
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('category service')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error("Service History Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching service history"
    });
  }
};

// Update service status
exports.updateServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;

    const service = await PartnerService.findOne({
      _id: serviceId,
      partner: req.partner._id
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    service.status = status;
    await service.save();

    res.json({
      success: true,
      message: "Service status updated",
      service
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating service status"
    });
  }
};


// Get matching bookings for partner
exports.getMatchingBookings = async (req, res) => {
  try {
    // Get partner's profile
    const profile = await Partner.findOne({ _id: req.partner._id }); 
    console.log("Profile:", profile);

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: "Partner profile not found"
      });
    }

    // Get partner's selected category, sub-category, and services
    const { category, subcategory, service } = profile;

    if (!category || !subcategory || !service || service.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Partner category, sub-category, or services not set"
      });
    }

    console.log("Partner Category:", category);
    console.log("Partner Sub-Category:", subcategory);
    console.log("Partner Services:", service);

    // Find sub-services that belong to the partner's selected services
    const subServices = await SubService.find({ service: { $in: service } }).select('_id');

    if (!subServices || subServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No sub-services found for the selected services"
      });
    }

    const subServiceIds = subServices.map(subService => subService._id);
    console.log("Eligible Sub-Services:", subServiceIds);

    // Find bookings where sub-service matches the partner's selected service
    const bookings = await Booking.find({
      subService: { $in: subServiceIds }, // Only fetch relevant sub-services
      status: { $in: ["pending"] },
    })
    .populate({
        path: 'service',
        populate: {
            path: 'subCategory',
            model: 'SubCategory',
            populate: {
                path: 'category',
                model: 'ServiceCategory',
                select: 'name' // Ensure the category name is fetched
            }
        }
    })
    .populate({
        path: 'user',
        select: 'name phone email' // Ensure user details are fetched
    })
    .populate({
        path: 'subService',
        select: 'name price duration description' // Ensure sub-service details are fetched
    })
    .populate({
        path: 'service',
        select: 'name' // Ensure service name is fetched
    })
    .populate({
        path: 'subCategory',
        model: 'SubCategory',
        select: 'name' // Ensure subcategory name is fetched
    })
    .select('-__v')
    .sort({ scheduledDate: 1, scheduledTime: 1 });

console.log("Found Bookings Count:", bookings.length);


    // Format the response
    const formattedBookings = bookings.map(booking => ({
      bookingId: booking._id,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      amount: booking.amount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      location: booking.location,
      user: {
        name: booking.user?.name || 'N/A',
        phone: booking.user?.phone || 'N/A',
        email: booking.user?.email || 'N/A'
      },
      subService: {
        name: booking.subService?.name || 'N/A',
        price: booking.subService?.price || 0,
        duration: booking.subService?.duration || 'N/A',
        description: booking.subService?.description || 'N/A'
      },
      service: {
        name: booking.service?.name || 'N/A'
      },
      category: {
        name: booking.category?.name || 'N/A'
      },
      subCategory: {
        name: booking.subCategory?.name || 'N/A'
      }
    }));

    res.json({
      success: true,
      count: formattedBookings.length,
      partnerDetails: {
        category,
        subcategory,
        service
      },
      bookings: formattedBookings
    });

  } catch (error) {
    console.error("Get Matching Bookings Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching matching bookings",
      error: error.message
    });
  }
};


//accept booking
exports.acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { partnerId } = req.body;

    if (!bookingId || !partnerId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and Partner ID are required",
      });
    }

    console.log("Partner ID:", partnerId);
    console.log("Booking ID:", bookingId);

    // Validate partner existence
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // Validate booking existence
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    console.log("Current Booking Status:", booking.status);

    // Check if booking is already accepted or canceled
    if (["accepted", "cancelled"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "Cannot accept this booking" });
    }

    // ✅ Update Booking: Assign partner and change status to 'accepted'
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { partner: partnerId, status: "accepted" },
      { new: true }
    );

    // ✅ Update Partner: Add booking to `bookings` array
    const updatedPartner = await Partner.findByIdAndUpdate(
      partnerId,
      { $addToSet: { bookings: bookingId } }, // Ensures no duplicates
      { new: true }
    );

    console.log("Updated Partner Bookings:", updatedPartner.bookings); // Debugging output

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error accepting booking:", error);
    res.status(500).json({
      success: false,
      message: "Error accepting booking",
      error: error.message,
    });
  }
};

//get accepted bookings
exports.getPartnerBookings = async (req, res) => {
  try {
    const { partnerId } = req.params;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    // Validate partner existence
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // Fetch all accepted bookings for this partner
    const bookings = await Booking.find({ partner: partnerId, status: "accepted" });

    res.status(200).json({
      success: true,
      message: "Accepted bookings retrieved successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching partner bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching partner bookings",
      error: error.message,
    });
  }
};


// Complete booking - Partner uploads photos before marking the job as completed
exports.completeBooking = async (req, res) => {
  const bookingId = req.params.id;
  const photos = req.files;

  try {
    // Find the booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the partner has uploaded photos
    if (!photos || photos.length === 0) {
      return res.status(400).json({ message: 'Please upload photos as proof before completing the booking' });
    }

    // Update the booking status to completed and store photos
    booking.status = 'completed';
    booking.paymentStatus = 'completed';
    booking.photos = photos.map(file => file.path);

    // Save the updated booking
    await booking.save();

    res.status(200).json({ message: 'Booking marked as completed', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error marking booking as completed', error });
  }
};


// Get completed bookings
exports.getCompletedBookings = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Get the token from the header
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
    const partnerId = decoded._id; // Extract partner ID from the decoded token

    const completedBookings = await Booking.find({
      partnerId: partnerId,
      status: 'completed'
    });

    if (!completedBookings.length) {
      return res.status(404).json({ message: 'No completed bookings found' });
    }

    res.status(200).json({ message: 'Completed bookings fetched successfully', bookings: completedBookings });
  } catch (error) {
    console.error('Error fetching completed bookings:', error);
    res.status(500).json({
      message: 'Error fetching completed bookings',
      error: error.message || 'Unknown error'
    });
  }
};

exports.getPendingBookings = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Get the token from the header
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
    const partnerId = decoded._id; // Extract partner ID from the decoded token

    const pendingBookings = await Booking.find({
      partnerId: partnerId,
      status: 'pending'
    });

    if (!pendingBookings.length) {
      return res.status(404).json({ message: 'No pending bookings found' });
    }

    res.status(200).json({ message: 'Pending bookings fetched successfully', bookings: pendingBookings });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      message: 'Error fetching pending bookings',
      error: error.message || 'Unknown error'
    });
  }
};

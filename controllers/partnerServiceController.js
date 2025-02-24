const PartnerService = require("../models/PartnerService");
const ServiceCategory = require("../models/ServiceCategory");
const Partner = require("../models/Partner");
const Booking = require("../models/booking");
const PartnerProfile = require("../models/PartnerProfile");

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
    const profile = await PartnerProfile.findOne({ partner: req.partner._id });

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: "Partner profile not found"
      });
    }

    // Get partner's category and service
    const partnerCategory = profile.category;
    const partnerService = profile.service;

    if (!partnerCategory || !partnerService) {
      return res.status(400).json({
        success: false,
        message: "Partner category and service not set"
      });
    }

    console.log("Partner Category:", partnerCategory);
    console.log("Partner Service:", partnerService);

    // Find bookings that match partner's category and service
    const bookings = await Booking.find({
      category: partnerCategory,
      service: partnerService,
      status: { $in: ["pending", "confirmed"] }, // Include both pending and confirmed bookings
    })
    .populate([
      {
        path: 'user',
        select: 'name phone email'
      },
      {
        path: 'service',
        select: 'name description basePrice duration'
      },
      {
        path: 'category',
        select: 'name description'
      }
    ])
    .select('-__v')
    .sort({ scheduledDate: 1, scheduledTime: 1 });

    console.log("Found Bookings Count:", bookings.length);
    
    // Debug: Log all bookings in the system
    const allBookings = await Booking.find({}).select('category service status paymentStatus');
    console.log("All Bookings in System:", JSON.stringify(allBookings, null, 2));

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
        name: booking.user ? booking.user.name : 'N/A',
        phone: booking.user ? booking.user.phone : 'N/A',
        email: booking.user ? booking.user.email : 'N/A'
      },
      service: {
        name: booking.service ? booking.service.name : 'N/A',
        basePrice: booking.service ? booking.service.basePrice : 0,
        duration: booking.service ? booking.service.duration : 'N/A',
        description: booking.service ? booking.service.description : 'N/A'
      },
      category: {
        name: booking.category ? booking.category.name : 'N/A',
        description: booking.category ? booking.category.description : 'N/A'
      }
    }));

    res.json({
      success: true,
      count: formattedBookings.length,
      partnerDetails: {
        category: partnerCategory,
        service: partnerService
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

// Accept booking
exports.acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if the booking is already accepted or canceled
    if (booking.status === "accepted" || booking.status === "canceled") {
      return res.status(400).json({
        success: false,
        message: "Cannot accept this booking",
      });
    }

    // Update booking status to accepted
    booking.status = "accepted";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
      data: booking,
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

// Complete booking
exports.completeBooking = async (req, res) => {
  const bookingId = req.params.id;
  const photos = req.files;

  try {
    // Update the booking status to completed and change payment status
    const booking = await Booking.findByIdAndUpdate(bookingId, { 
      status: 'completed', 
      paymentStatus: 'completed', 
      photos: photos.map(file => file.path) 
    }, { new: true });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({ message: 'Booking marked as completed', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error marking booking as completed', error });
  }
};

const Booking = require("../models/booking");
const PartnerProfile = require("../models/PartnerProfile");
const PartnerWallet = require("../models/PartnerWallet");

// Get job alerts
exports.getJobAlerts = async (req, res) => {
  try {
    const partner = await PartnerProfile.findOne({ partner: req.partner._id });
    
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    if (partner.dutyStatus !== "on") {
      return res.status(400).json({ message: "Please turn on duty status to receive jobs" });
    }

    // Get relevant jobs based on partner's service categories and location
    const jobs = await Booking.find({
      status: "pending",
      serviceCategory: { $in: partner.serviceCategories.map(cat => cat.mainCategory) },
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: partner.currentLocation.coordinates
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    }).populate("user", "name phone");

    res.json(jobs);
  } catch (error) {
    console.error("Get Job Alerts Error:", error);
    res.status(500).json({ message: "Error fetching job alerts" });
  }
};

// Accept job
exports.acceptJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "This job is no longer available" });
    }

    booking.partner = req.partner._id;
    booking.status = "accepted";
    await booking.save();

    res.json({ message: "Job accepted successfully", booking });
  } catch (error) {
    console.error("Accept Job Error:", error);
    res.status(500).json({ message: "Error accepting job" });
  }
};

// Start job
exports.startJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp, images, video } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      partner: req.partner._id
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.startOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    booking.status = "in_progress";
    booking.startImages = images;
    booking.startVideo = video;
    booking.startTime = new Date();
    await booking.save();

    res.json({ message: "Job started successfully", booking });
  } catch (error) {
    console.error("Start Job Error:", error);
    res.status(500).json({ message: "Error starting job" });
  }
};

// Complete job
exports.completeJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { images, video } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      partner: req.partner._id
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "completed";
    booking.completionImages = images;
    booking.completionVideo = video;
    booking.completionTime = new Date();
    await booking.save();

    // Update partner statistics
    const profile = await PartnerProfile.findOne({ partner: req.partner._id });
    profile.statistics.completedJobs += 1;
    await profile.save();

    res.json({ message: "Job completed successfully", booking });
  } catch (error) {
    console.error("Complete Job Error:", error);
    res.status(500).json({ message: "Error completing job" });
  }
};

// Get job history
exports.getJobHistory = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { partner: req.partner._id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name phone")
      .populate("serviceCategory", "name");

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get Job History Error:", error);
    res.status(500).json({ message: "Error fetching job history" });
  }
};

// Toggle duty status
exports.toggleDutyStatus = async (req, res) => {
  try {
    const profile = await PartnerProfile.findOne({ partner: req.partner._id });
    
    if (!profile) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    // Check wallet balance
    const wallet = await PartnerWallet.findOne({ partner: req.partner._id });
    if (wallet.balance < wallet.minBalance) {
      return res.status(400).json({ 
        message: "Insufficient wallet balance. Please recharge to go on duty." 
      });
    }

    profile.dutyStatus = profile.dutyStatus === "on" ? "off" : "on";
    await profile.save();

    res.json({ 
      message: `Duty status turned ${profile.dutyStatus}`,
      dutyStatus: profile.dutyStatus
    });
  } catch (error) {
    console.error("Toggle Duty Status Error:", error);
    res.status(500).json({ message: "Error toggling duty status" });
  }
};

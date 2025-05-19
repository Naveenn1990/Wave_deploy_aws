const DriverBooking = require('../models/DriverBooking');
const VehicleType = require('../models/DriverFare');
const User = require('../models/User');
// const { sendBookingConfirmation } = require('../services/emailService');
// const { generateInvoice } = require('../services/invoiceService');

const travelBooking = {
  /**
   * Create a new Tempo Traveller booking
   */
  createBooking: async (req, res) => {
    try {
      const { 
        pickupLocation,
        dropoffLocation,
        date,
        time,
        passengers,
        luggage,
        paymentMethod,
        notes
      } = req.body;
      const userId = req.user._id
      console.log("Req.user" , req.user._id)
      // Validate required fields
      if (!req.user._id || !pickupLocation || !date || !time) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, pickupLocation, date, time'
        });
      }

      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get Tempo Traveller vehicle type
      const vehicleType = await VehicleType.findOne({ name: 'Tempo Traveller' });
      if (!vehicleType) {
        return res.status(404).json({
          success: false,
          message: 'Tempo Traveller vehicle type not configured'
        });
      }

      // Calculate distance and estimated time (you would typically use Google Maps API here)
      // For this example, we'll use the values from the frontend
      let { distance, estimatedTime } = req.body;
      distance      = Number(distance);
      estimatedTime = Number(estimatedTime);
      if (!distance || !estimatedTime) {
        return res.status(400).json({
          success: false,
          message: 'distance and estimatedTime are required and must be numbers'
        });
      }


      // Calculate price
      const baseFare = vehicleType.baseFare;
      const distanceCost = distance * vehicleType.perKmRate;
      const timeCost = estimatedTime * (vehicleType.perMinuteRate || 0);
      
      // Apply night surcharge if booking is during night hours (10PM to 6AM)
      const bookingDateTime = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes);
      
      const bookingHour = bookingDateTime.getHours();
      const isNightBooking = bookingHour >= 22 || bookingHour < 6;
      const nightSurchargeCost = isNightBooking ? baseFare * 0.2 : 0; // 20% surcharge
      
      // Calculate total price
      const subtotal = baseFare + distanceCost + timeCost + nightSurchargeCost;
      const tax = subtotal * 0.05; // 5% tax
      const total = subtotal + tax;

      // Create new booking
      const newBooking = new DriverBooking({
        // bookingId,
        userId,
        vehicleType: vehicleType._id,
        pickupLocation: {
          address: pickupLocation.address,
          coordinates: [pickupLocation.lng, pickupLocation.lat]
        },
        dropoffLocation: dropoffLocation ? {
          address: dropoffLocation.address,
          coordinates: [dropoffLocation.lng, dropoffLocation.lat]
        } : null,
        bookingDetails: {
          date,
          time,
          passengers: passengers || 1,
          luggage: luggage || 0
        },
        distance,
        estimatedTime,
        price: {
          total,
          breakdown: {
            baseFare,
            distanceCost,
            timeCost,
            nightSurchargeCost,
            tax
          }
        },
        isNightBooking,
        paymentMethod,
        notes,
        status: 'pending'
      });

      // Save booking to database
      const savedBooking = await newBooking.save();
 
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: savedBooking, 
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message
      });
    }
  },

  /**
   * Get booking by ID
   */
  getBooking: async (req, res) => {
    console.log("Req.body : " , req.body)
    try {
      const booking = await DriverBooking.findById(req.params.id)
        .populate('userId', 'name email phone')
        .populate('driverId', 'name phone')
        .populate('vehicleType', 'name capacity basePrice pricePerKm');

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        booking
      });
    } catch (error) {
      console.error("error : " , error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking',
        error: error.message
      });
    }
  },

  /**
   * Update booking status
   */
  updateBookingStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const allowedStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const booking = await DriverBooking.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        message: 'Booking status updated',
        booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update booking status',
        error: error.message
      });
    }
  },

  /**
   * Get bookings for a user
   */// .populate('vehicleType');
  getUserTravelBookings: async (req, res) => {  
    console.log("Req.user" , req.user._id)
    try {
      const bookings = await DriverBooking.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        

      res.json({
        success: true,
        count: bookings.length,
        bookings
      });
    } catch (error) {
      console.log("Error : " , error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user bookings',
        error: error
      });
    }
  }
};

module.exports = travelBooking;
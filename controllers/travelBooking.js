const DriverBooking = require('../models/DriverBooking');
const VehicleType = require('../models/DriverFare');
const User = require('../models/User');
// const { sendBookingConfirmation } = require('../services/emailService');
// const { generateInvoice } = require('../services/invoiceService');

const travelBooking = {
  /**
   * Create a new Tempo Traveller booking
   */
  createTTBooking: async (req, res) => {
    try {
      const { 
        pickupLocation,
        dropoffLocation,
        date,
        time, 
        paymentMethod,
        notes,
        tempoTraveller,
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
        tempoTraveller,
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

  createDriverBooking: async (req, res) => {
    try {
      const {
        pickupLocation,
        dropoffLocation,
        date,
        time,
        paymentMethod,
        tempoTraveller,
        carModel,
        carType,
        currentBooking,
        distance,
        estimatedTime,
      } = req.body;

      const userId = req.user._id;
      console.log("Req.user", req.user._id);

      if (!userId || !pickupLocation) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, pickupLocation',
        });
      }

      const vehicleType = await VehicleType.findOne({ name: 'Driver' });
      if (!vehicleType) {
        return res.status(404).json({
          success: false,
          message: 'Driver type fare not configured',
        });
      }

      const parsedDistance = Number(distance);
      const parsedEstimatedTime = Number(estimatedTime);

      if (!parsedDistance || !parsedEstimatedTime) {
        return res.status(400).json({
          success: false,
          message: 'distance and estimatedTime are required and must be numbers',
        });
      }

      // === Safely set date and time ===
      const now = new Date();
      const bookingDateTime = date ? new Date(date) : new Date(now);
      const timeString = time || now.toTimeString().split(':').slice(0, 2).join(':'); // "HH:mm"

      const [hours, minutes] = timeString.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      // Night check
      const bookingHour = bookingDateTime.getHours();
      const isNightBooking = bookingHour >= 22 || bookingHour < 6;

      // Pricing logic
      const baseFare = vehicleType.baseFare;
      const distanceCost = parsedDistance * vehicleType.perKmRate;
      const timeCost = parsedEstimatedTime * (vehicleType.perMinuteRate || 0);
      const nightSurchargeCost = isNightBooking ? baseFare * 0.2 : 0;
      const subtotal = baseFare + distanceCost + timeCost + nightSurchargeCost;
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      const newBooking = new DriverBooking({
        userId,
        vehicleType: vehicleType._id,
        pickupLocation: {
          address: pickupLocation.address,
          coordinates: [pickupLocation.lng, pickupLocation.lat],
        },
        dropoffLocation: dropoffLocation ? {
          address: dropoffLocation.address,
          coordinates: [dropoffLocation.lng, dropoffLocation.lat],
        } : undefined,
        bookingDetails: {
          date: bookingDateTime,
          time: timeString,
        },
        distance: parsedDistance,
        estimatedTime: parsedEstimatedTime,
        price: {
          total,
          breakdown: {
            baseFare,
            distanceCost,
            timeCost,
            nightSurchargeCost,
            tax,
          },
        },
        isNightBooking,
        paymentMethod,
        tempoTraveller,
        carModel,
        carType,
        currentBooking,
        status: 'pending',
      });

      const savedBooking = await newBooking.save();

      res.status(201).json({
        success: true,
        message: 'Driver booked successfully',
        booking: savedBooking,
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message,
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
 
  getUserTravelBookings: async (req, res) => {  
    console.log("Req.user", req.user._id);
    try {
      const bookings = await DriverBooking.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .populate('userId')           // populate user data
        .populate('driverId')         // populate driver data (if assigned)
        .populate('vehicleType');     // populate vehicle type info

      res.json({
        success: true,
        count: bookings.length,
        bookings
      });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user bookings',
        error: error.message
      });
    }
  },

  cancelUserTravelBooking: async (req, res) => {
    // const session = await mongoose.startSession();
    // session.startTransaction();
    
    try {
      const { bookingId } = req.params;
      const { cancellationReason } = req.body;
      const userId = req.user._id.toString()

      // Validate input
      if (!cancellationReason || !userId) {
        // await session.abortTransaction();
        // session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Cancellation reason and user ID are required'
        });
      }

      // Find the booking
      const booking = await DriverBooking.findById(bookingId)  
      if (!booking) {
        // await session.abortTransaction();
        // session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      console.log("booking : " , booking)
      console.log("booking.userId.toString() : " , booking.userId.toString() , userId)
      // Check if user owns the booking
      if (booking.userId.toString() !== userId) {
        // await session.abortTransaction();
        // session.endSession();
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to cancel this booking'
        });
      }

      // Check if booking can be cancelled
      const cancellableStatuses = ['pending', 'accepted'];
      if (!cancellableStatuses.includes(booking.status)) {
        // await session.abortTransaction();
        // session.endSession();
        return res.status(400).json({
          success: false,
          message: `Booking cannot be cancelled in its current state (${booking.status})`
        });
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.cancellationReason = cancellationReason;
      booking.updatedAt = new Date();

      // Process refund if payment was made
      // if (booking.paymentStatus === 'paid') {
      //   try {
      //     const refundResult = await refundPayment(booking._id);
      //     if (refundResult.success) {
      //       booking.paymentStatus = 'refunded';
      //     } else {
      //       booking.paymentStatus = 'refund_pending';
      //     }
      //   } catch (error) {
      //     console.error('Refund processing error:', error);
      //     booking.paymentStatus = 'refund_failed';
      //   }
      // }

      // Save the updated booking
      await booking.save();

      // Notify driver if booking was accepted
      // if (booking.driverId) {
      //   await sendNotification({
      //     userId: booking.driverId,
      //     type: 'booking_cancelled',
      //     title: 'Booking Cancelled',
      //     message: `Booking ${booking.bookingId} has been cancelled by user`,
      //     data: { bookingId: booking._id }
      //   });
      // }

      // Update user's booking history
      // await User.findByIdAndUpdate(
      //   userId,
      //   { $inc: { cancelledBookings: 1 } },
      //   { session }
      // );

      // await session.commitTransaction();
      // session.endSession();

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: {
          bookingId: booking._id,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        }
      });

    } catch (error) {
      // await session.abortTransaction();
      // session.endSession();
      
      console.error('Error cancelling booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        error: error.message
      });
    }
  },

};

module.exports = travelBooking;
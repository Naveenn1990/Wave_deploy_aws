const Booking = require('../models/DriverBooking');
const Driver = require('../models/PartnerModel');
const VehicleType = require('../models/DriverFare');
const User = require('../models/User'); // Assuming User model exists
const calculateDistance = require('../config/calculateDistance');
const generateBookingId = require('../config/generateBookingId');
const Notification = require('../models/Notification'); // Assuming you have a Notification model
// const { sendBookingConfirmation } = require('../services/emailService');
// const { generateInvoice } = require('../services/invoiceService');

const sendNotification = async ({ userId, title, body, data, fcmtoken }) => {
  try {
    // Save notification to DB
    const notification = new Notification({
      title,
      userId,
      message: body,
      createdAt: new Date(),
      read: false,
    });
    await notification.save();
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error.message);
  }
};
// Create a booking (user)
exports.driverBooking = async (req, res) => {
  const { pickupLocation, dropoffLocation, userId,
          paymentMode, amount, scheduledTime, scheduledDate, 
        } = req.body;

  try {
    // Validate vehicle type
    const vehicleType = await VehicleType.findOne();
    if (!vehicleType) return res.status(400).json({ error: 'Invalid vehicle type' });

    // Generate unique booking ID
    const bookingId = await generateBookingId();

    // Calculate distance
    const distance = calculateDistance(
      pickupLocation.coordinates[1],
      pickupLocation.coordinates[0],
      dropoffLocation.coordinates[1],
      dropoffLocation.coordinates[0]
    );

    // Calculate price (simplified)
    const baseFare = vehicleType.baseFare;
    const distanceCost = distance * vehicleType.perKmRate;
    const total = parseFloat((baseFare + distanceCost).toFixed(2));

    // Create booking
    const booking = new Booking({
      bookingId,
      userId: req.user._id,
      vehicleType: vehicleType._id,
      pickupLocation: { type: 'Point', coordinates: pickupLocation.coordinates },
      dropoffLocation: { type: 'Point', coordinates: dropoffLocation.coordinates },
      distance,
      price: {
        total,
        breakdown: { baseFare, distanceCost, timeCost: 0, surgeCost: 0, nightSurchargeCost: 0, tax: 0 },
      },
    });

    // Find nearest available driver
    const driver = await Driver.findOne({
      isAvailable: true,
      vehicleType: vehicleType._id,
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: pickupLocation.coordinates },
          $maxDistance: 5000,
        },
      },
    });

    if (driver) {
      booking.driverId = driver._id;
      booking.status = 'assigned';
      driver.isAvailable = false;
      await driver.save();

      // Send notification to driver
      await sendNotification({
        userId: driver._id,
        title: 'New Booking Assigned',
        body: `Booking ${bookingId} has been assigned to you.`,
        data: {
          type: 'driver-booking',
          bookingId: booking._id.toString(),
          pickup: JSON.stringify(booking.pickupLocation),
          dropoff: JSON.stringify(booking.dropoffLocation),
        },
        fcmtoken: driver.fcmtoken,
      });
      booking.notificationSent = true;
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};
// exports.driverBooking = async (req , res) => {
//       try {
//       const {
//         userId,
//         pickupLocation,
//         dropoffLocation,
//         date,
//         time,
//         passengers,
//         luggage,
//         paymentMethod,
//         notes
//       } = req.body;

//       // Validate required fields
//       if (!userId || !pickupLocation || !date || !time) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields: userId, pickupLocation, date, time'
//         });
//       }

//       // Validate user exists
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       // Get Tempo Traveller vehicle type
//       const vehicleType = await VehicleType.findOne({ name: 'Tempo Traveller' });
//       if (!vehicleType) {
//         return res.status(404).json({
//           success: false,
//           message: 'Tempo Traveller vehicle type not configured'
//         });
//       }

//       // Calculate distance and estimated time (you would typically use Google Maps API here)
//       // For this example, we'll use the values from the frontend
//       const { distance, estimatedTime } = req.body;

//       // Calculate price
//       const baseFare = vehicleType.basePrice;
//       const distanceCost = distance * vehicleType.pricePerKm;
//       const timeCost = estimatedTime * (vehicleType.pricePerMinute || 0);
      
//       // Apply night surcharge if booking is during night hours (10PM to 6AM)
//       const bookingDateTime = new Date(date);
//       const [hours, minutes] = time.split(':').map(Number);
//       bookingDateTime.setHours(hours, minutes);
      
//       const bookingHour = bookingDateTime.getHours();
//       const isNightBooking = bookingHour >= 22 || bookingHour < 6;
//       const nightSurchargeCost = isNightBooking ? baseFare * 0.2 : 0; // 20% surcharge
      
//       // Calculate total price
//       const subtotal = baseFare + distanceCost + timeCost + nightSurchargeCost;
//       const tax = subtotal * 0.05; // 5% tax
//       const total = subtotal + tax;

//       // Create new booking
//       const newBooking = new DriverBooking({
//         userId,
//         vehicleType: vehicleType._id,
//         pickupLocation: {
//           address: pickupLocation.address,
//           coordinates: [pickupLocation.lng, pickupLocation.lat]
//         },
//         dropoffLocation: dropoffLocation ? {
//           address: dropoffLocation.address,
//           coordinates: [dropoffLocation.lng, dropoffLocation.lat]
//         } : null,
//         bookingDetails: {
//           date,
//           time,
//           passengers: passengers || 1,
//           luggage: luggage || 0
//         },
//         distance,
//         estimatedTime,
//         price: {
//           total,
//           breakdown: {
//             baseFare,
//             distanceCost,
//             timeCost,
//             nightSurchargeCost,
//             tax
//           }
//         },
//         isNightBooking,
//         paymentMethod,
//         notes,
//         status: 'pending'
//       });

//       // Save booking to database
//       const savedBooking = await newBooking.save();

//       // Generate invoice
//       const invoice = await generateInvoice(savedBooking, user);

//       // Send booking confirmation email
//       await sendBookingConfirmation(user, savedBooking, invoice);

//       res.status(201).json({
//         success: true,
//         message: 'Booking created successfully',
//         booking: savedBooking,
//         invoiceUrl: invoice.url
//       });

//     } catch (error) {
//       console.error('Error creating booking:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to create booking',
//         error: error.message
//       });
//     }
// }

// Accept a booking (driver)
exports.acceptBookingDriver = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.driverId.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.status !== 'assigned') {
      return res.status(400).json({ error: 'Booking cannot be accepted' });
    }

    booking.status = 'accepted';
    await booking.save();

    // Send notification to user
    const user = await User.findById(booking.userId);
    if (user.fcmtoken) {
      await sendNotification({
        userId: booking.driverId,
        title: 'Booking Accepted',
        body: `Your booking ${booking.bookingId} has been accepted by the driver.`,
        data: {
          type: 'booking-update',
          bookingId: booking._id.toString(),
          status: 'accepted',
        },
        fcmtoken: user.fcmtoken,
      });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Reject a booking (driver)
exports.rejectBookingDriver = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.driverId.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.status !== 'assigned') {
      return res.status(400).json({ error: 'Booking cannot be rejected' });
    }

    booking.status = 'rejected';
    booking.driverId = null; // Clear driver assignment
    await booking.save();

    // Make original driver available again
    const originalDriver = await Driver.findById(req.partner._id);
    originalDriver.isAvailable = true;
    await originalDriver.save();

    // Find another available driver
    const newDriver = await Driver.findOne({
      isAvailable: true,
      vehicleType: booking.vehicleType,
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: booking.pickupLocation.coordinates },
          $maxDistance: 5000,
        },
      },
    });

    if (newDriver) {
      booking.driverId = newDriver._id;
      booking.status = 'assigned';
      newDriver.isAvailable = false;
      await newDriver.save();

      // Send notification to new driver
      await sendNotification({
        userId: newDriver._id,
        title: 'New Booking Assigned',
        body: `Booking ${booking.bookingId} has been assigned to you.`,
        data: {
          type: 'new-booking',
          bookingId: booking._id.toString(),
          pickup: JSON.stringify(booking.pickupLocation),
          dropoff: JSON.stringify(booking.dropoffLocation),
        },
        fcmtoken: newDriver.fcmtoken,
      });
      booking.notificationSent = true;
    } else {
      booking.status = 'pending'; // No drivers available
    }

    await booking.save();

    // Send notification to user
    const user = await User.findById(booking.userId);
    if (user.fcmtoken) {
       sendNotification({
        userId: booking.driverId,
        title: 'Booking Update',
        body: `Your booking ${booking.bookingId} was rejected. ${newDriver ? 'A new driver has been assigned.' : 'Awaiting new driver.'}`,
        data: {
          type: 'booking-update',
          bookingId: booking._id.toString(),
          status: booking.status,
        },
        fcmtoken: user.fcmtoken,
      });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get bookings by user ID
exports.getByUserId = async (req, res) => {
  try {
    const data = await Booking.find({ userId: req.user._id }).sort({ _id: -1 });
    return res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get bookings by driver ID
exports.getByDriverId = async (req, res) => {
  try {
    const data = await Booking.find({ driverId: req.partner._id }).sort({ _id: -1 });
    return res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};
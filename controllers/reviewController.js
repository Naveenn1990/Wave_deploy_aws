 const Review = require('../models/Review');
const User = require('../models/User');
const Booking = require('../models/booking');
const SubService = require('../models/SubService');
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");

// Submit a new review
exports.submitReview = async (req, res) => {
    const { user, subService, rating, comment } = req.body;
    console.log(user, subService, rating, comment , "testing")
    // console.log(user, subService, rating, comment);
    try {
        const review = new Review({ user, subService, rating, comment });
        await review.save();
        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        res.status(400).json({ message: 'Error submitting review', error: error.message });
    }
};  

// Get reviews for a specific subservice

exports.getReviews = async (req, res) => {
    const { subServiceId } = req.params;
    try {
        const reviews = await Review.find({ subService: subServiceId }).populate('user', 'name');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving reviews', error: error.message });
    }
};

exports.topUpWallet = async (req, res) => {
  console.log("1")
    try {
      const { userId } = req.params;
      const wallet = await Wallet.findOne({ userId });
  
      if (!wallet) {
        return res.status(404).json({ message: "No Transactions Found!" });
      }
  
      res.json({ balance: wallet.balance, transactions: wallet.transactions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

exports.transactionsWallet = async (req, res) => {
  console.log("2")
  try {
    const { userId, amount, type } = req.body;
    console.log({ userId, amount, type })

    if (!userId || !amount || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // let user = await User.findOne( {_id : userId});
    // console.log("User : " , user)
    let wallet = await Wallet.findOne({ userId });
    // if (!user){
    //   return res.status(400).json({ message: "User Not Found, Please Login" });
    // }

    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0, transactions: [] });
    }
    
    if (type === "Debit" && wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    
    const newTransaction = {
      transactionId: uuidv4(),
      amount,
      type,
    };
    
    wallet.transactions.push(newTransaction);
    wallet.balance += type === "Credit" ? amount : -amount;
    console.log("Wallet " , wallet)
    
    await wallet.save();

    res.status(201).json({ message: "Transaction successful", wallet });
  } catch (error) {
    console.log("Error : " , error)
    res.status(500).json({ error: error.message });
  }
}



// // Function to get all reviews
// exports.getAllReviews = async (req, res) => {
//     try {
//         const reviews = await Review.find(); // Fetch all reviews from the database
//         res.status(200).json(reviews);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching reviews', error });
//     }
// };

// Get all reviews
// Get all reviews
// Get all reviews
// exports.getAllReviews = async (req, res) => {
//     try {
//         const reviews = await Review.find()
//             .populate('user', 'name email') // Populate user details
//             .populate({
//                 path: 'booking',
//                 populate: [
//                     { path: 'subService', select: 'name description' }, // Populate sub-service from booking
//                     { path: 'partner', select: 'name contact' } // Populate partner from booking
//                 ]
//             })
//             .lean(); // Convert to plain JS objects for better performance

//         return res.status(200).json({
//             success: true,
//             count: reviews.length,
//             data: reviews.map(review => ({
//                 user: {
//                     name: review.user?.name || 'N/A',
//                     email: review.user?.email || 'N/A'
//                 },
//                 booking: {
//                     id: review.booking?._id || 'N/A',
//                     date: review.booking?.date || 'N/A',
//                     status: review.booking?.status || 'N/A'
//                 },
//                 subService: {
//                     id: review.booking?.subService?._id || 'N/A',
//                     name: review.booking?.subService?.name || 'N/A',
//                     description: review.booking?.subService?.description || 'N/A'
//                 },
//                 partner: {
//                     id: review.booking?.partner?._id || 'N/A',
//                     name: review.booking?.partner?.name || 'N/A',
//                     contact: review.booking?.partner?.contact || 'N/A'
//                 },
//                 rating: review.rating,
//                 comment: review.comment,
//                 createdAt: review.createdAt
//             }))
//         });
//     } catch (error) {
//         console.error('Error fetching reviews:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Error fetching reviews',
//             error: error.message
//         });
//     }
// };



// Get all reviews for Admin
// exports.getAllReviewsForAdmin = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         const filter = {};
//         if (req.query.userId) filter.user = req.query.userId;
//         if (req.query.partnerId) filter['booking.partner'] = req.query.partnerId;

//         const reviews = await Review.find(filter)
//             .populate('user', 'name email') // Populate user details
//             .populate({
//                 path: 'booking',
//                 populate: [
//                     { path: 'subService', select: 'name description' }, // Populate sub-service from booking
//                     { path: 'partner', select: 'name contact' } // Populate partner from booking
//                 ]
//             })
//             .sort({ createdAt: -1 }) // Sort by latest reviews first
//             .skip(skip)
//             .limit(limit)
//             .lean();

//         const totalReviews = await Review.countDocuments(filter); // Get total count for pagination

//         return res.status(200).json({
//             success: true,
//             count: reviews.length,
//             totalReviews,
//             currentPage: page,
//             totalPages: Math.ceil(totalReviews / limit),
//             data: reviews.map(review => ({
//                 user: {
//                     name: review.user?.name || 'N/A',
//                     email: review.user?.email || 'N/A'
//                 },
//                 booking: {
//                     id: review.booking?._id || 'N/A',
//                     date: review.booking?.date || 'N/A',
//                     status: review.booking?.status || 'N/A'
//                 },
//                 subService: {
//                     id: review.booking?.subService?._id || 'N/A',
//                     name: review.booking?.subService?.name || 'N/A',
//                     description: review.booking?.subService?.description || 'N/A'
//                 },
//                 partner: {
//                     id: review.booking?.partner?._id || 'N/A',
//                     name: review.booking?.partner?.name || 'N/A',
//                     contact: review.booking?.partner?.contact || 'N/A'
//                 },
//                 rating: review.rating,
//                 comment: review.comment,
//                 createdAt: review.createdAt
//             }))
//         });
//     } catch (error) {
//         console.error('Error fetching reviews for admin:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Error fetching reviews',
//             error: error.message
//         });
//     }
// };




// Get all reviews for Admin with partner details
exports.getAllReviewsForAdminWithPartnerDetails = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('subService', 'name') // Populate sub-service name
            .populate({
                path: 'partner',
                select: 'name email phone address', // Populate partner/provider details
            })
            .lean(); // Convert to plain JS objects for better performance

        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews.map(review => ({
                rating: review.rating,
                comment: review.comment,
                subServiceName: review.subService?.name || 'N/A',
                partner: review.partner,
            }))
        });
    } catch (error) {
        console.error('Error fetching admin reviews with partner details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching admin reviews with partner details',
            error: error.message
        });
    }
};

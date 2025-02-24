// controllers/offerController.js
const Offer = require('../models/offer');
const path = require('path');
const multer = require('multer');


// Set up storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where images will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage });

// Create Offer
exports.createOffer = async (req, res) => {
    try {
        const { couponCode, discount, startDate, endDate, offerTitle } = req.body;
        const promotionalImage = req.file.path; // Get the path of the uploaded image

        const newOffer = new Offer({ couponCode, discount, startDate, endDate, promotionalImage, offerTitle });
        await newOffer.save();
        res.status(201).json({ success: true, data: newOffer });
    } catch (error) {
        console.error("🔥 Error creating offer:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Edit Offer
exports.editOffer = async (req, res) => {
    const { id } = req.params;
    console.log("req Body", req.body )
    // Collecting update fields dynamically
    const updateFields = {};

    if (req.body.couponCode) updateFields.couponCode = req.body.couponCode;
    if (req.body.discount) updateFields.discount = req.body.discount;
    if (req.body.startDate) updateFields.startDate = req.body.startDate;
    if (req.body.endDate) updateFields.endDate = req.body.endDate;
    if (req.body.offerTitle) updateFields.offerTitle = req.body.offerTitle;

    // Handling the image separately (if provided)
    if (req.file && req.file.path) {
        updateFields.promotionalImage = req.file.path;
    }
    console.log('Update fields:', updateFields);


    try {
        // Find the offer and update it with new fields
        const updatedOffer = await Offer.findByIdAndUpdate(id, updateFields, {
            new: true, // Return the updated document
            runValidators: true // Ensure model validations are applied
        });

        if (!updatedOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.status(200).json(updatedOffer);
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Delete Offer
exports.deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOffer = await Offer.findByIdAndDelete(id);
        if (!deletedOffer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        res.status(200).json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
        console.error("🔥 Error deleting offer:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// Fetch All Offers
exports.getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.find(); // Fetch all offers from the database
        res.status(200).json({ success: true, data: offers });
    } catch (error) {
        console.error("🔥 Error fetching offers:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


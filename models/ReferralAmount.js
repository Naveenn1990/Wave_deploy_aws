const mongoose = require("mongoose");

// Referral Amount Schema
const referralAmountSchema = new mongoose.Schema({              
    referralUserAm: {
        type: Number,
        required: true,
        default: 0
    },
    referralPartnerAm: {
        type: Number,
        required: true,
        default: 0
    },
    joiningAmountUser: {
        type: Number,   
        required: true,
        default: 0  
    },
    joiningAmountPartner: {
        type: Number,
        required: true,
        default: 0
    },
    
}, { timestamps: true });

 

module.exports = mongoose.model("ReferralAmount", referralAmountSchema);
// Exporting the model  
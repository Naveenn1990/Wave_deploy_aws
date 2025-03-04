// const mongoose = require('mongoose');

// const subServiceSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     description: {
//         type: String,
//         required: true
//     },
//     service: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Service',
//         required: true
//     },
//     subCategory: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'SubCategory', 
//     },
//     price: {
//         type: Number,
//         required: true
//     },
//     icon: [{
//         type: String // Array of URLs or paths to images
//     }],
//     includes: {
//         type: [String], // Array of strings to list included features
//         default: [],
//     },
//     excludes: {
//         type: [String], // Array of strings to list excluded features
//         default: [],
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// const SubService = mongoose.model('SubService', subServiceSchema);

// module.exports = SubService;



const mongoose = require('mongoose');

const subServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory', 
    },
<<<<<<< HEAD
    mrp: {
=======
    // review: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Review', 
    // },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review', 
    }], 
    price: {
>>>>>>> a00ac6a5b01b14bddcc491b899cbd8f154428918
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0 // Discount percentage
    },
    basePrice: {
        type: Number,
        // required: true
    },
    gst: {
        type: Number,
        default: 0 // GST percentage
    },
    icon: [{
        type: String // Array of URLs or paths to images (max 10)
    }],
    includes: {
        type: [String],
        default: [],
    },
    excludes: {
        type: [String],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to calculate basePrice
subServiceSchema.pre('save', function (next) {
    this.basePrice = this.mrp - (this.mrp * this.discount / 100);
    next();
});

const SubService = mongoose.model('SubService', subServiceSchema);

module.exports = SubService;

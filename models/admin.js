// const mongoose = require("mongoose");

// const adminSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     role: {
//       type: String,
//       enum: ["super_admin", "admin"],
//       default: "admin",
//     },
//     modules: [
//       {
//         type: String,
//         status: Boolean,
//         enum: ["dashboard", "Banner" , "Categories" , "Sub Categories" , "Services" , 
//           "Sub Services" , "Offers" , "Product Inventory" , "Booking" , "Refund Request" ,
//            "Reviews", "Customer" , "Provider Verification" , "Verified Provider" , "Enquiry",  
//         ],
//       }
//     ],
//     permissions: [
//       {
//         type: String,
//         enum: [
//           "manage_partners",
//           "manage_services",
//           "manage_categories",
//           "manage_promotions",
//           "manage_customers",
//           "view_reports",
//         ],
//       },
//     ],
//     status: {
//       type: String,
//       enum: ["active", "inactive"],
//       default: "active",
//     },
//     notifications:[],
//   },
//   {
//     timestamps: true,
//   }
// );

// // Export the model
// module.exports = mongoose.model("Admin", adminSchema);


const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "subadmin"],
      default: "admin",
    }, 
    notifications: [], 
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Reference to the admin who created the subadmin
      default: null,
    },
    // Permissions for Subadmins (Controlled by Admin)
    permissions: {
      dashboard: { type: Boolean, default: false },
      subadmin: { type: Boolean, default: false },
      banner: { type: Boolean, default: false },
      categories: { type: Boolean, default: false },
      subCategories: { type: Boolean, default: false },
      services: { type: Boolean, default: false },
      subServices: { type: Boolean, default: false },
      offers: { type: Boolean, default: false },
      productInventory: { type: Boolean, default: false },
      booking: { type: Boolean, default: false },
      refundRequest: { type: Boolean, default: false },
      reviews: { type: Boolean, default: false },
      customer: { type: Boolean, default: false },
      providerVerification: { type: Boolean, default: false },
      verifiedProvider: { type: Boolean, default: false },
      enquiry: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Admin", adminSchema);

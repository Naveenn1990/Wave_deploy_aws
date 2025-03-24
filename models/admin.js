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
      enum: ["super_admin", "admin"],
      default: "admin",
    },
    permissions: [
      {
        type: String,
        enum: [
          "manage_partners",
          "manage_services",
          "manage_categories",
          "manage_promotions",
          "manage_customers",
          "view_reports",
        ],
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    notifications:[],
  },
  {
    timestamps: true,
  }
);

// Export the model
module.exports = mongoose.model("Admin", adminSchema);

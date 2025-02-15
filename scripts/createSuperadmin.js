const mongoose = require("mongoose");
const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: "super_admin" });
    if (existingSuperAdmin) {
      console.log("Super admin already exists!");
      process.exit(0);
    }

    const superAdmin = new Admin({
      email: "superadmin@wave.com",
      password: await bcrypt.hash("admin123", 12),
      name: "Super Admin",
      role: "super_admin",
      permissions: [
        "manage_partners",
        "manage_services",
        "manage_categories",
        "manage_promotions",
        "manage_customers",
        "view_reports",
      ],
    });

    await superAdmin.save();
    console.log("Super admin created successfully!");
    console.log("Email: superadmin@wave.com");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
}

createSuperAdmin();

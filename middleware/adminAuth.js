const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        message: "Invalid admin account",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = { adminAuth };

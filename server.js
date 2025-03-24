const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/database");
const path = require("path");
const multer = require("multer");
const morgan = require("morgan");
const fs = require("fs"); 
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require("dotenv").config();
const bodyParser = require('body-parser');
const socketIo = require("socket.io");
const http = require("http");
const Booking = require("./models/booking");  

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

 // Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/booking-chat/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "chat-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Please upload an image file"));
    }
  },
});

app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    let chat = await Booking.findById(req.body.bookingId);
    if (!chat) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const imageUrl = `${req.file.filename}`;
    const imageMessage = {
      event: "chat image",
      data: {
        bookingId: req.body.bookingId,
        senderId: req.body.senderId,
        image: imageUrl,
      },
    };

    chat.chat.push(imageMessage);
    await chat.save();

    // Emit the event
    io.emit("receive message", { bookingId: chat._id, messages: chat.chat });

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Error saving chat image:", error);
    res.status(500).json({ error: "Server error occurred." });
  }
});

const userSockets = {}; 

const adminSockets = {};  
 
io.on("connection", (socket) => {
  console.log("User/Admin connected:", socket.id);

  // Handle text and image messages
  socket.on("chat message", async (message) => {
    console.log("Message received:", message);
    try {
      let chat = await Booking.findById(message?.data?.bookingId);
      if (!chat) {
        return socket.emit("error", "Booking not found.");
      }

      chat.chat.push(message);
      await chat.save();

      // Emit event to the sender
      socket.emit("message received", {
        bookingId: chat._id,
        message: message.data, 
      });

      // Broadcast to all clients
      io.emit("receive message", {
        bookingId: chat._id,
        messages: chat.chat,
      });
    } catch (error) {
      console.error("Error saving chat message:", error);
      socket.emit("error", "Server error occurred.");
    }
  });

  // Handle image upload
  socket.on("chat image", async (data, callback) => {
    console.log("data :", data )
    try {
      upload.single("image")(data.req, data.res, async (err) => {
        if (err) {
          return callback({ error: err.message });
        }

        let chat = await Booking.findById(data.bookingId);
        if (!chat) {
          return callback({ error: "Booking not found." });
        }
 
        const imageUrl = `${data.req.file.filename}`;
        const imageMessage = {
          event: "chat image",
          data: {
            bookingId: data.bookingId,
            senderId: data.senderId,
            image: imageUrl,
            timestamp: new Date().toISOString(),
          },
        }; 

        console.log("imageMessage :" , imageMessage)

        chat.chat.push(imageMessage);
        await chat.save();

        // Send image message to sender and other clients
        socket.emit("message received", imageMessage);
        io.emit("receive message", { bookingId: chat._id, messages: chat.chat });
        callback({ success: true, imageUrl });
      });
    } catch (error) {
      console.error("Error saving chat image:", error);
      callback({ error: "Server error occurred." });
    }
  });

  // Handle retrieving messages
  socket.on("receive message", async (data) => {
    // console.log("Fetching messages for booking ID:", data.data?.bookingId);
    try {
      let chat = await Booking.findById(data.data?.bookingId);
      if (!chat) {
        return socket.emit("error", "No chat found for this booking ID.");
      }
      socket.emit("receive message", {
        bookingId: chat._id,
        messages: chat.chat,
      });
    } catch (error) {
      console.error("Error retrieving chat messages:", error);
      socket.emit("error", "Error retrieving chat messages.");
    }
  });
 
  socket.on("join", (userId) => {
    console.log(`Received join event from user ${userId}`);
    socket.join(userId); // Join the user-specific room

    if (!userSockets[userId]) {
      userSockets[userId] = [];
    }
    userSockets[userId].push(socket.id);

    console.log(`User ${userId} joined with socket ${socket.id}`);
  }); 

  socket.on("join admin", (adminId) => {
    console.log(`Received join event from admin ${adminId}`);
    socket.join(adminId); // Join the admin-specific room

    if (!adminSockets[adminId]) {
      adminSockets[adminId] = [];
    }
    adminSockets[adminId].push(socket.id);

    console.log(`Admin ${adminId} joined with socket ${socket.id}`);
  }); 

  // socket.on("disconnect", () => {
  //   console.log("User disconnected:", socket.id);
  // });

  socket.on("disconnect", () => {
    console.log("User/Admin disconnected:", socket.id);

    // Cleanup userSockets
    for (const userId in userSockets) {
      userSockets[userId] = userSockets[userId].filter(
        (id) => id !== socket.id
      );
      if (userSockets[userId].length === 0) {
        delete userSockets[userId];
      }
    }

    // Cleanup adminSockets
    for (const adminId in adminSockets) {
      adminSockets[adminId] = adminSockets[adminId].filter(
        (id) => id !== socket.id
      );
      if (adminSockets[adminId].length === 0) {
        delete adminSockets[adminId];
      }
    }
  });

}); 

console.log("userSockets : " , userSockets)
console.log("adminSockets : " , adminSockets)

global.io = io; // Make socket available globally

connectDB()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });



// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Wave API Documentation"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure helmet with necessary adjustments
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Create uploads directories if they don't exist
const dirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads", "banners"),
  path.join(__dirname, "uploads", "promotional-banners"),
  path.join(__dirname, "uploads", "company-banners")
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static files with proper headers
const staticDirs = [
  { url: '/uploads', dir: 'uploads' },
  { url: '/uploads/banners', dir: 'uploads/banners' },
  { url: '/uploads/promotional-banners', dir: 'uploads/promotional-banners' },
  { url: '/uploads/company-banners', dir: 'uploads/company-banners' }
];

staticDirs.forEach(({ url, dir }) => {
  app.use(url, (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  }, express.static(path.join(__dirname, dir)));
});

// Import routes
const userRoutes = require("./routes/userRoutes");
const userServiceRoutes = require("./routes/userServiceRoutes");
const userBookingRoutes = require("./routes/userBookingRoutes");
const userAccountRoutes = require("./routes/userAccountRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminServiceRoutes = require("./routes/adminServiceRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const serviceHierarchyRoutes = require("./routes/serviceHierarchyRoutes");
const adminBannerRoutes = require("./routes/adminBannerRoutes");
const userBannerRoutes = require("./routes/userBannerRoutes");
const adminBookingRoutes = require("./routes/adminBookingRoutes");
const adminBookingController = require('./controllers/adminBookingController');
 
// Routes
app.use("/api/user", userRoutes);
app.use("/api/user", userServiceRoutes);
app.use("/api/user", userBookingRoutes);
app.use("/api/user/account", userAccountRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/services", adminServiceRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/public", serviceHierarchyRoutes);
app.use("/api/admin/banners", adminBannerRoutes);
app.use("/api/user/banners", userBannerRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);

// Root route for WebSocket server
app.get('/', (req, res) => {
  res.send("WebSocket Server is Running");
});

app.get('/admin/bookings', adminBookingController.getAllBookings);

// 404 handler
app.use((req, res, next) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
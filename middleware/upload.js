const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
const fullUploadPath = path.join(__dirname, '..', uploadDir);
if (!fs.existsSync(fullUploadPath)) {
    fs.mkdirSync(fullUploadPath, { recursive: true });
}

// Create banners subdirectory if it doesn't exist
const bannerPath = path.join(fullUploadPath, 'banners');
if (!fs.existsSync(bannerPath)) {
    fs.mkdirSync(bannerPath, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Choose destination based on route
        const dest = req.originalUrl.includes('/banners') ? bannerPath : fullUploadPath;
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        // Store filename in request for easy access
        req.uploadedFilename = filename;
        cb(null, filename);
    }
});

// Create multer upload middleware
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Middleware to process uploaded file path
const processFilePath = (req, res, next) => {
    if (req.file) {
        // Use the filename we stored earlier
        req.file.filename = req.uploadedFilename;
        req.file.path = req.uploadedFilename;
    }
    next();
};

// Strip URL from filename
const stripUrl = (filename) => {
    if (!filename) return filename;
    // Handle various URL patterns
    if (filename.includes('http://localhost:9000/uploads/')) {
        return filename.replace('http://localhost:9000/uploads/', '');
    }
    if (filename.includes('http://localhost:9000/')) {
        return filename.replace('http://localhost:9000/', '');
    }
    if (filename.includes('/')) {
        return filename.split('/').pop();
    }
    return filename;
};

module.exports = { upload, processFilePath, stripUrl };

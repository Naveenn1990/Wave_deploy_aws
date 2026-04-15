// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Ensure upload directory exists
// const uploadDir = path.join(__dirname, '..', 'uploads', 'icons');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Configure multer for storing icons
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log('Multer destination:', { file });
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     console.log('Multer filename:', { file });
//     const cleanFileName = file.originalname.toLowerCase().replace(/[^a-z0-9.]/g, '-');
//     cb(null, `${Date.now()}-${cleanFileName}`);
//   }
// });

// // File filter to accept only images
// const fileFilter = (req, file, cb) => {
//   console.log('Multer fileFilter:', { 
//     file,
//     mimetype: file.mimetype,
//     originalname: file.originalname 
//   });
  
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Not an image! Please upload an image file.'), false);
//   }
// };

// // Create multer instance with configuration
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // 5MB limit
//   }
// });

// // Add debug middleware
// const debugUpload = (fieldName) => {
//   return (req, res, next) => {
//     console.log('\n=== Upload Debug Start ===');
//     console.log('Request Headers:', {
//       'content-type': req.headers['content-type'],
//       'content-length': req.headers['content-length']
//     });
//     console.log('Field Name:', fieldName);
//     console.log('Initial Body:', req.body);
    
//     const uploadSingle = upload.single(fieldName);
    
//     uploadSingle(req, res, (err) => {
//       if (err) {
//         console.error('Upload Error:', err);
//         if (err instanceof multer.MulterError) {
//           return res.status(400).json({
//             success: false,
//             message: `Upload error: ${err.message}`,
//             code: err.code
//           });
//         }
//         return res.status(400).json({
//           success: false,
//           message: err.message
//         });
//       }
      
//       console.log('Post-upload Request:', {
//         body: req.body,
//         file: req.file ? {
//           fieldname: req.file.fieldname,
//           originalname: req.file.originalname,
//           mimetype: req.file.mimetype,
//           size: req.file.size,
//           path: req.file.path
//         } : 'No file'
//       });
      
//       // Ensure req.body is properly populated
//       if (!req.body || Object.keys(req.body).length === 0) {
//         console.error('Error: Request body is empty after file upload');
//         return res.status(400).json({
//           success: false,
//           message: "No form data received"
//         });
//       }
      
//       // Trim string values
//       Object.keys(req.body).forEach(key => {
//         if (typeof req.body[key] === 'string') {
//           req.body[key] = req.body[key].trim();
//         }
//       });
      
//       console.log('=== Upload Debug End ===\n');
//       next();
//     });
//   };
// };

// module.exports = {
//   upload,
//   debugUpload
// };

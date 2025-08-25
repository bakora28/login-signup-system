// File Upload Configuration - Simplified with Local Storage + Manual S3 Upload
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads/profile-pictures');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Common file filter for images
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// File size limit
const fileSizeLimit = 5 * 1024 * 1024; // 5MB limit

// Local Storage Configuration (always used for initial upload)
const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = file.originalname.split('.').pop();
        cb(null, `${req.user?.id || 'guest'}-${uniqueSuffix}.${fileExtension}`);
    }
});

// Create multer instance with local storage
const upload = multer({
    storage: localStorage,
    limits: {
        fileSize: fileSizeLimit
    },
    fileFilter: fileFilter
});

// Check if S3 is configured
const isS3Configured = () => {
    try {
        require('dotenv').config();
        return !!(process.env.AWS_ACCESS_KEY_ID && 
                  process.env.AWS_SECRET_ACCESS_KEY && 
                  process.env.AWS_S3_BUCKET_NAME);
    } catch (error) {
        return false;
    }
};

module.exports = {
    upload,
    isS3Configured
};

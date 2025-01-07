const multer = require('multer');
const fs = require('fs');
const env = require('../util/validateEnv');
const AppError = require('../util/appError');

// Storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const path = "src/uploads";

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }

        // Destination folder where the uploaded files should be stored
        callback(null, path);
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    },
});

// Create the multer instance for image only
const upload = multer({
    storage,
    fileFilter: (req, file, callback) => {
        // Only accept images (MIME types for image files)
        if (!file.mimetype.startsWith('image/')) {
            return callback(new AppError({ 
                name: 'Multer error', 
                statusCode: 400, 
                message: 'Only image files are allowed.' 
            }), false);
        }
        callback(null, true);
    }
});

module.exports = function (req, res, next) {
    const fileType = req.query?.fileType;

    // Check for the fileType query parameter to ensure it's "image"
    if (fileType !== 'image') {
        throw new AppError({ 
            name: 'Multer error', 
            statusCode: 400, 
            message: 'Only image upload is allowed.' 
        });
    }

    // Single image upload
    upload.single('file')(req, res, (error) => {
        if (error) {
            console.error('Error uploading image:', error);
            throw new AppError({ 
                name: 'Multer error', 
                statusCode: 500, 
                message: 'Image upload failed' 
            });
        }
        console.log('Image upload successful');
        next();
    });
};

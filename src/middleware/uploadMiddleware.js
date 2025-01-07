const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
const AppError = require('../util/appError');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Multer for local file handling
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const uploadPath = path.resolve(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    callback(null, uploadPath);
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(
        new AppError({
          name: 'Multer Error',
          statusCode: 400,
          message: 'Only image files are allowed.',
        }),
        false
      );
    }
    callback(null, true);
  },
});

// Middleware to upload to Cloudinary
module.exports = async (req, res, next) => {
  upload.single('image')(req, res, async (error) => {
    if (error) {
      console.error('Error uploading image:', error);
      return next(error);
    }

    if (req.file) {
      try {
        const filePath = req.file.path;
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'doctors',
        });

        req.fileUrl = result.secure_url;
        fs.unlinkSync(filePath);
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return next(
          new AppError({
            name: 'Cloudinary Upload Error',
            statusCode: 500,
            message: 'Failed to upload image to Cloudinary.',
          })
        );
      }
    } else {
      return next(
        new AppError({
          name: 'File Upload Error',
          statusCode: 400,
          message: 'No image file uploaded.',
        })
      );
    }
    next();
  });
};

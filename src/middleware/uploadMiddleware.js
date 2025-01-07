const multer = require('multer');
const fs = require('fs');
const env = require('../util/validateEnv');
const AppError = require('../util/appError');

// Define the storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const path = env.NODE_ENV === "docker" ? "/usr/src/app/dist/uploads" : "src/uploads";

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }

        // Specify the destination folder where the uploaded files should be stored
        callback(null, path);
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    },
});

// Create the multer instance
const upload = multer({ storage });

module.exports = function (req, res, next) {
    const fileType = req.query?.fileType;
    if (fileType !== 'image' && fileType !== 'video') {
        throw new AppError({ name: 'Multer error', statusCode: 500, message: `${fileType} upload failed` });
    }

    upload.single('file')(req, res, (error) => {
        if (error) {
            console.error(`Error uploading ${fileType}:`, error);
            throw new AppError({ name: 'Multer error', statusCode: 500, message: `${fileType} upload failed` });
        }
        console.log(fileType, 'reached here');
        next();
    });
};

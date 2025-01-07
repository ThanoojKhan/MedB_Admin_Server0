const adminModel = require('../models/admin/adminModel');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const env = require('../util/validateEnv');
const jwt = require('jsonwebtoken');

exports.authMiddleware = catchAsync(async (req, res, next) => {

     // Skip the authorization check for the registration endpoint
     if (req.url === '/api/admin/auth/registerAdmin') {
        return next();
    }

    // Get the access token from the authorization header
    if (!req.headers.authorization) {
        throw new AppError({ name: 'Unauthorized', statusCode: 401, message: 'Invalid access token' });
    }

    // Get refresh token
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError({ name: 'Unauthorized', statusCode: 401, message: 'Invalid refresh token' });
    }

    // Verify tokens
    const token = req.headers.authorization.split(" ")[1];
    const decodedAccessToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const decodedRefreshToken = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

    const adminId = decodedRefreshToken.adminId === decodedAccessToken.adminId ? decodedRefreshToken.adminId : null;

    // Find admin
    const admin = await adminModel.findById(adminId);
    if (!admin) {
        throw new AppError({ name: 'Unauthorized', statusCode: 401, message: 'Invalid token' });
    }

    req.admin = admin;
    next();
});

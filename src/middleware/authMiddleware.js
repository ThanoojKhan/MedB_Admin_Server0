const adminModel = require('../models/admin/adminModel');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const env = require('../util/validateEnv');
const jwt = require('jsonwebtoken');

exports.authMiddleware = catchAsync(async (req, res, next) => {
    const publicRoutes = ['/api/admin/auth/registerAdmin', '/api/admin/auth/login'];
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    if (!req.headers.authorization) {
        throw new AppError({ name: 'Unauthorized', statusCode: 401, message: 'Access token missing or invalid' });
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedAccessToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

        const admin = await adminModel.findById(decodedAccessToken.adminId);
        if (!admin) {
            throw new AppError({ name: 'Unauthorized', statusCode: 401, message: 'Admin not found' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError({ name: 'Unauthorized', statusCode: 401, message: 'Access token expired' });
        }
        throw new AppError({ name: 'Unauthorized', statusCode: 401, message: 'Invalid access token' });
    }
});

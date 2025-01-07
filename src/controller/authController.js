const catchAsync = require("../util/catchAsync");
const adminModel = require("../models/admin/adminModel");
const tokenModel = require("../models/token/tokenModel");
const AppError = require("../util/appError");
const env = require('../util/validateEnv');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const ms = require('ms');

// Check if running in development mode
const dev = env.NODE_ENV === "development";

// Create new admin
exports.newAdmin = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new AppError({ statusCode: 400, message: 'Email and password are required' });
    }

    // Check if admin with the given email already exists
    const isExist = await adminModel.exists({ email });
    if (isExist) {
        throw new AppError({ statusCode: 403, message: 'Email already exists' });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    await adminModel.create({
        email,
        password: hashPassword
    });

    res.sendStatus(201);
});

// Login verification
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) throw new AppError({ statusCode: 400, message: 'Credentials required' });
    const admin = await adminModel.findOne({ email });
    if (!admin) throw new AppError({ statusCode: 401, message: 'Invalid credentials' });
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) throw new AppError({ statusCode: 401, message: 'Invalid credentials' });

    // Generate access token
    const accessToken = generateJWT(
        { adminId: admin._id, isMaster: admin.isMaster, access: admin.access },
        env.ACCESS_TOKEN_SECRET,
        env.ACCESS_TOKEN_LIFE
    );

    // Generate refresh token
    const refreshToken = generateJWT(
        { adminId: admin._id, isMaster: admin.isMaster, access: admin.access },
        env.REFRESH_TOKEN_SECRET,
        env.REFRESH_TOKEN_LIFE
    );

    // Save refresh token
    await tokenModel.findOneAndUpdate({ userId: admin._id }, { $set: { refreshToken } }, { upsert: true, new: true });

    // Set refresh token as HTTP only cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: !dev,
        maxAge: ms(env.REFRESH_TOKEN_LIFE)
    });

    return res.status(200).json({ accessToken });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res) => {
    const { password } = req.body;
    if (!password) throw new AppError({ statusCode: 400, message: 'Password required' });

    const hashPassword = await bcrypt.hash(password, 10);
    await adminModel.updateOne({ _id: req.admin._id }, { $set: { password: hashPassword } });
    res.sendStatus(200);
});

// Refresh accessToken
exports.refreshAccessToken = catchAsync(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError({ statusCode: 401, message: 'Refresh token not provided' });
    }

    // Verify refresh token
    const decodedToken = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
    const adminId = decodedToken.adminId;

    const refreshTokenInDB = await tokenModel.findOne({ userId: adminId, refreshToken });
    if (!refreshTokenInDB) {
        throw new AppError({ statusCode: 401, message: 'Invalid refresh token' });
    }

    // Generate access token
    const accessToken = generateJWT(
        { adminId: adminId, isMaster: decodedToken.isMaster },
        env.ACCESS_TOKEN_SECRET,
        env.ACCESS_TOKEN_LIFE
    );

    return res.status(200).json({ accessToken });
});

// Logout
exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError({ statusCode: 401, message: 'Refresh token not provided' });
    }

    const findTokenAndDelete = await tokenModel.findOneAndDelete({ refreshToken });
    if (!findTokenAndDelete) {
        throw new AppError({ statusCode: 401, message: 'Invalid refresh token' });
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: !dev,
    });

    res.sendStatus(200);
};

// Generate JWT
const generateJWT = (payload, secret, expirationTime) => {
    return jwt.sign(payload, secret, { expiresIn: expirationTime });
};

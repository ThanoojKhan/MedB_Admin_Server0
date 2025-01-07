const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const tokenSchema = new Schema({
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    fcmToken: { type: String },
    refreshToken: { type: String },
    createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = model('Token', tokenSchema);
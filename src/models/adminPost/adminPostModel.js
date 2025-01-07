const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Define the admin post schema
const adminPostSchema = new Schema({
    content: {
        url: { type: String, required: true },
        id: { type: String, required: true },
        thumbnail: { type: String }
    },
    contentType: { type: String, enum: ['image', 'video'], required: true },
    title: { type: String, required: true },
    source: { type: String },
    caption: { type: String },
    hashTags: { type: [String] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Hidden'], default: 'Active' },
    audience: {
        gender: { type: [String] },
        idVerification: { type: [String] },
        subscription: { type: [String] },
        country: { type: String },
        states: { type: [String] }
    }
}, { timestamps: true });

// Create and export the model
module.exports = model('AdminPost', adminPostSchema);

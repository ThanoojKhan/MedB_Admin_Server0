const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Define the admin schema
const adminSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Create the model and export it
module.exports = model('Admin', adminSchema);

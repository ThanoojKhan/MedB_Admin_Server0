const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const doctorSchema = new Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    contactNumber: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/,
    },
    registrationNumber: { type: String, required: true },
    image: {
        type: String,
        required: true,
        validate: {
            validator: (value) => /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp))$/i.test(value),
            message: 'Invalid image URL format',
        },
    },
}, { timestamps: true });

module.exports = model('Doctor', doctorSchema);

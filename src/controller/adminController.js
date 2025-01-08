const { v2: cloudinary } = require('cloudinary');
const axios = require("axios");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
const env = require("../util/validateEnv");
const doctorModel = require("../models/adminPost/doctorModel");

// Get Doctors
exports.getDoctors = catchAsync(async (req, res) => {
    const { page } = req.params;
    const { query } = req.query;

    const limit = 10;
    const skip = (parseInt(page) - 1) * limit;

    try {
        const searchFilter = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { specialization: { $regex: query, $options: 'i' } },
                { qualification: { $regex: query, $options: 'i' } },
            ]
        };

        const doctors = await doctorModel.find(searchFilter)
            .skip(skip)
            .limit(limit);

        const total = await doctorModel.countDocuments(searchFilter);

        res.json({
            doctors,
            total,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while fetching doctors.' });
    }
});



// Add post
exports.addDoctor = catchAsync(async (req, res) => {
    const { name, age, specialization, qualification, contactNumber, registrationNumber } = req.body;

    // Validation for required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError({ statusCode: 400, message: 'Invalid or missing name.' });
    }

    if (!age || isNaN(age) || age < 25 || age > 100) {
        throw new AppError({ statusCode: 400, message: 'Invalid or missing age. Must be between 25 and 100.' });
    }

    if (!specialization || typeof specialization !== 'string' || specialization.trim() === '') {
        throw new AppError({ statusCode: 400, message: 'Invalid or missing specialization.' });
    }

    if (!qualification || typeof qualification !== 'string' || qualification.trim() === '') {
        throw new AppError({ statusCode: 400, message: 'Invalid or missing qualification.' });
    }

    if (!contactNumber || !/^\d{10}$/.test(contactNumber)) {
        throw new AppError({ statusCode: 400, message: 'Invalid or missing contact number. Must be a 10-digit number.' });
    }

    if (!registrationNumber || typeof registrationNumber !== 'string' || registrationNumber.trim() === '') {
        throw new AppError({ statusCode: 400, message: 'Invalid or missing registration number.' });
    }

    if (!req.fileUrl) {
        throw new AppError({
            statusCode: 400,
            message: 'Image upload failed. No file URL found.',
        });
    }

    try {
        // Check if the name or registration number already exists in the database
        const existingDoctor = await doctorModel.findOne({
            $or: [{ name }, { registrationNumber }],
        });

        if (existingDoctor) {
            // Delete the uploaded image if a duplicate doctor exists
            await deleteCloudinaryFile(req.fileUrl);
            throw new AppError({
                statusCode: 400,
                message: 'Doctor with the same name or registration number already exists.',
            });
        }

        // Create the doctor document
        await doctorModel.create({
            name,
            age,
            specialization,
            qualification,
            contactNumber,
            registrationNumber,
            image: req.fileUrl,
        });

        res.status(201).json({ status: 'success', message: 'Doctor added successfully.' });
    } catch (error) {
        await deleteCloudinaryFile(req.fileUrl);
        console.error('Error during doctor creation:', error);

        throw new AppError({ statusCode: 500, message: error.message || 'Failed to process doctor record.' });
    }
});

// Function to delete the image from Cloudinary
const deleteCloudinaryFile = async (fileUrl) => {
    try {
        const publicId = fileUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`doctors/${publicId}`);
        console.log('Cloudinary file deleted successfully.');
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
    }
};

// Update post
exports.updateDoctor = catchAsync(async (req, res) => {

    const { id } = req.params;
    const { name, age, specialization, qualification, contactNumber, registrationNumber } = req.body;

    // Check if the doctor exists in the database
    const doctor = await doctorModel.findById(id);
    if (!doctor) {
        throw new AppError({ statusCode: 404, message: 'Doctor not found.' });
    }

    // Validation for required fields (only validate if provided)
    if (name && (typeof name !== 'string' || name.trim() === '')) {
        throw new AppError({ statusCode: 400, message: 'Invalid name.' });
    }

    if (age && (isNaN(age) || age < 25 || age > 100)) {
        throw new AppError({ statusCode: 400, message: 'Invalid age. Must be between 25 and 100.' });
    }

    if (specialization && (typeof specialization !== 'string' || specialization.trim() === '')) {
        throw new AppError({ statusCode: 400, message: 'Invalid specialization.' });
    }

    if (qualification && (typeof qualification !== 'string' || qualification.trim() === '')) {
        throw new AppError({ statusCode: 400, message: 'Invalid qualification.' });
    }

    if (contactNumber && !/^\d{10}$/.test(contactNumber)) {
        throw new AppError({ statusCode: 400, message: 'Invalid contact number. Must be a 10-digit number.' });
    }

    if (registrationNumber && (typeof registrationNumber !== 'string' || registrationNumber.trim() === '')) {
        throw new AppError({ statusCode: 400, message: 'Invalid registration number.' });
    }

    try {
        // Check for duplicate name or registration number (excluding current doctor)
        if (name || registrationNumber) {
            const existingDoctor = await doctorModel.findOne({
                $and: [
                    { _id: { $ne: id } },
                    {
                        $or: [{ name }, { registrationNumber }],
                    },
                ],
            });

            if (existingDoctor) {
                throw new AppError({
                    statusCode: 400,
                    message: 'Doctor with the same name or registration number already exists.',
                });
            }
        }

        // Update the doctor fields
        if (req.fileUrl) {
            if (doctor.image) {
                await deleteCloudinaryFile(doctor.image);
            }
            doctor.image = req.fileUrl;
        }

        if (name) doctor.name = name;
        if (age) doctor.age = age;
        if (specialization) doctor.specialization = specialization;
        if (qualification) doctor.qualification = qualification;
        if (contactNumber) doctor.contactNumber = contactNumber;
        if (registrationNumber) doctor.registrationNumber = registrationNumber;

        await doctor.save();

        res.status(200).json({ status: 'success', message: 'Doctor updated successfully.' });
    } catch (error) {
        if (req.fileUrl) {
            await deleteCloudinaryFile(req.fileUrl);
        }
        console.error('Error during doctor update:', error);

        throw new AppError({ statusCode: 500, message: error.message || 'Failed to update doctor record.' });
    }
});

// Delete post
exports.deleteDoctor = catchAsync(async (req, res) => {
    const { id } = req.params;
    const doctorImageUrl = await doctorModel.findOne({ _id: id }, 'image');

    if (!id) {
        throw new AppError({ name: 'No ID', statusCode: 400, message: 'Doctor ID is required.' });
    }

    const doctor = await doctorModel.findByIdAndDelete(id);

    if (!doctor) {
        throw new AppError({ statusCode: 400, message: 'Invalid doctor ID or doctor not found.' });
    }
    await deleteCloudinaryFile(doctorImageUrl.image);
    res.status(200).json({ status: 'success', message: 'Doctor deleted successfully.' });
});


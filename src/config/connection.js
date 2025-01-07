require('dotenv').config();
const env = require('../../src/util/validateEnv');
const mongoose = require('mongoose');

const db = env.MONGO_CONNECTION_STRING;

module.exports = async function () {
    mongoose.set("strictQuery", true);
    await mongoose.connect(db)
        .then(() => {
            console.log("Database connected successfully");
        })
        .catch((error) => {
            console.error("Database connection failed:", error);
        });
};

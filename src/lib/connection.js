const mongoose = require("mongoose");

const dbConnect = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.DATABASE_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 60000 // Timeout after 60 seconds
        });
        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
    }
};

module.exports = dbConnect;
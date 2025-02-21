const mongoose = require("mongoose");

const RaTlCsvSchema = new mongoose.Schema({
    filename: { type: String, required: false },
    originalname: { type: String, required: false },
    mimetype: { type: String, required: false },
    size: { type: Number, required: false },
    path: { type: String, required: false },
    content: { type: Buffer }, // Optional: Store file content as binary
    campaignName: { type: String, required: false }, // Add campaign name
    campaignCode: { type: String, required: false }, // Add campaign code
    status: [{
        userType: { type: String, required: false }, // e.g., "Quality", "Email Marketing"
        checked: { type: Boolean, required: false, default: false } // Whether the user has checked the file
    }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false } // Add userId to associate files with users
}, { timestamps: true }); // Enable timestamps

const RatlSChema = mongoose.model("RatlCsvFile", RaTlCsvSchema);

module.exports = RatlSChema;
const mongoose = require("mongoose");

const OperationCsvSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    content: { type: Buffer }, // Optional: Store file content as binary
    campaignName: { type: String, required: true }, // Add campaign name
    campaignCode: { type: String, required: true }, // Add campaign code
    status: { type: String, default: 'Done' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false } // Add userId to associate files with users
}, { timestamps: true }); // Enable timestamps

const RaMasterSChema = mongoose.model("RAMasterCsvFile", OperationCsvSchema);

module.exports = RaMasterSChema;
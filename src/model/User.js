const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    mobile: {
        type: Number,
        required: true,
        trim: true,
    },
    otp: String,
    otpExpires: Date,
    password: {
        type: String,
        required: true,
        trim: true,
    },
    picture: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'developer', 'supervisor', 'oxmanager', 'reasercher', , 'hr', 'agent', 'client', 'quality', 'email_marketing', 'delivery', 'guest', 'teamleader'],
        default: 'user',
    },
    // Add login timestamps
    loginTimes: [{
        timestamp: {
            type: Date,
            default: Date.now, // Default login time when the user logs in
        },
    }, ],
    logoutTimes: [{ timestamp: { type: Date, default: Date.now } }],
    comments: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;
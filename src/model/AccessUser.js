// models/AccessUser.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    date_of_hiring: { type: Date, required: true },
    designation: { type: String, required: false },
    supervisor: { type: String, required: true },
    salary: { type: Number, required: true },
    shift: { type: String, required: true },
    other_designation: { type: [String], required: true },
});

const AccessUser = mongoose.model('AccessUser', userSchema);

module.exports = AccessUser;
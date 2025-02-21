const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: String,
    start: Date,
    end: Date,
    type: String,
});

const Event = mongoose.model("Event", eventSchema)
module.exports = Event;
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: false,
    },
    sender: {
        type: String,
        required: false,
    },
    time: {
        type: String,
        required: false,
    },
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
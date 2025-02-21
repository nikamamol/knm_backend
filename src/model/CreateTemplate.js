const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema({
    template_title: { type: String, required: false },
    logo: { type: String, required: false },
    banner: { type: String, required: false },
    form_type: { type: String, required: false },
    form_link: { type: String, required: false },
    receive_comminication: { type: String, required: false },
    document: { type: String, required: false },
    html_content: { type: String, required: false },
    date: { type: Date, default: Date.now } // Adds date with current timestamp as default
});

const Template = mongoose.model("Template", templateSchema);

module.exports = Template;

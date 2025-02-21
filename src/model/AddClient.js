const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  client_name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
});

const Client = mongoose.model("AddNewClient", clientSchema);
module.exports = Client;
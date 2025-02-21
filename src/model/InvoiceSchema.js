const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
    logo: String,
    date: String,
    invoiceNumber: String,
    clientName: String,
    clientAddress: String,
    items: [{
        qty: Number,
        description: String,
        price: Number,
        total: Number,
    }],
    subTotal: Number,
    tax: Number,
    grandTotal: Number,
    bankName: String,
    accountNumber: String,
    terms: String,
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);
module.exports = Invoice;
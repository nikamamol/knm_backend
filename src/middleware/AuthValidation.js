const Joi = require('joi');

const signupValidation = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400)
            .json({ message: "Bad request", error })
    }
    next();
}
const loginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400)
            .json({ message: "Bad request", error })
    }
    next();
}
const accessUserValidation = (req, res, next) => {
    const schema = Joi.object({
      fullname: Joi.string().min(3).max(100).required(),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(100).required(),
      date_of_hiring: Joi.date().iso().required(),
      designation: Joi.string().min(2).max(100).required(),
      supervisor: Joi.string().min(3).max(100).required(),
      salary: Joi.number().positive().required(),
      shift: Joi.string().valid('Day', 'Night', 'Evening').required(),
      other_designation: Joi.array().items(Joi.string().min(2).max(100)).required(),
    });
  
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Bad request", error: error.details });
    }
    next();
  };


const vendorValidationSchema = Joi.object({
    company_name: Joi.string().min(3).max(100).required(),
    company_type: Joi.string().valid('Small', 'Medium', 'Large').required(),
    vendor_profile: Joi.string().uri().required(),
    agency_id: Joi.number().integer().required(),
    country: Joi.number().integer().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    address: Joi.string().required(),
    primary_first_name: Joi.string().min(2).max(50).required(),
    primary_last_name: Joi.string().min(2).max(50).required(),
    primary_phone_no: Joi.string().pattern(/^[0-9]{10}$/).required(),
    primary_email: Joi.string().email().required(),
    primary_designation: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(8).max(100).required(),
    secondary_first_name: Joi.string().min(2).max(50).optional(),
    secondary_last_name: Joi.string().min(2).max(50).optional(),
    secondary_phone_no: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    secondary_email: Joi.string().email().optional(),
    secondary_designation: Joi.string().min(2).max(50).optional(),
  });
  
module.exports = {
    signupValidation,
    loginValidation,
    accessUserValidation,
    vendorValidationSchema
}
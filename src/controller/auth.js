const User = require("../model/User");
const uplaodCSV = require("../model/CsvData");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const AccessUser = require("../model/AccessUser");
const Vendor = require("../model/InviteVendor");
const Client = require("../model/AddClient");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fastcsv = require("fast-csv");
const CompanySchema = require("../model/CsvData");
const CampaignSchema = require("../model/CampaignSchema");
const Template = require("../model/CreateTemplate");
const authenticateToken = require("../middleware/auth");
const operationCsvFile = require("../model/OperationCsv");
const OperationCsvFile = require("../model/OperationCsv");
const InvoiceSchema = require("../model/InvoiceSchema");
const Invoice = require("../model/InvoiceSchema");
const RaMasterSChema = require("../model/RaMasterSChema");
const QualityCheckedSChema = require("../model/QualityCheckedFIle");
const QualityMasterCsvFile = require("../model/QualityMaster");
const EMCheckedSChema = require("../model/EmailCheckedFiles");
const UploadMasterEmCheckFile = require("../model/UploadMasterEmCheckFile");
const OperationMasterFileSchema = require("../model/OperationMasterCsvFile");
const UnwantedLeads = require("../model/UnwantedLeads");
const SuppressionOrTalFiles = require("../model/Suppressiontal");
const Message = require("../model/SupportChat");
const Event = require("../model/Event");
const RatlSChema = require("../model/UploadraTl");

require("dotenv").config();

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
    debug: true, // Enable debug output
    logger: true, // Log information
});

exports.signup = async(req, res) => {
    const { firstName, lastName, email, password, phone, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ message: "User already exists!" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            username: `${firstName} ${lastName}`, // You can concatenate first and last names for username or adjust as needed
            email,
            password: hashedPassword,
            mobile: phone, // Use phone for mobile
            role, // Include role here
        });
        return res.status(201).send({ user });
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).send({ message: "Error signing up!", error });
    }
};

exports.getAllRegisterUsers = async(req, res) => {
    try {
        const users = await User.find(); // Retrieve all users from the database
        return res.status(200).send({ users });
    } catch (error) {
        console.error("Error retrieving users:", error);
        return res.status(500).send({ message: "Error retrieving users!", error });
    }
};

exports.login = async(req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user is already authenticated by verifying the token
        const token = req.headers.authorization;

        if (token) {
            try {
                const decodedToken = jwt.verify(token, process.env.JWT_KEY);
                return res.status(200).send({
                    message: "User already authenticated",
                    redirectTo: "/dashboard",
                });
            } catch (err) {
                console.error("Invalid token", err);
            }
        }

        // Continue with login process
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(400).send({ message: "User not found" });
        }

        const passwordMatched = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!passwordMatched) {
            return res.status(400).send({ message: "Wrong password" });
        }

        // Log the login time
        existingUser.loginTimes.push({ timestamp: new Date() });
        await existingUser.save();

        // Generate OTP as needed
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresIn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        existingUser.otp = otp;
        existingUser.otpExpires = expiresIn;
        await existingUser.save();

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending OTP email:", error);
                return res
                    .status(500)
                    .send({ message: "Error sending OTP email", error });
            } else {
                console.log("Email sent: " + info.response);
                return res
                    .status(200)
                    .send({ message: "OTP sent successfully", email });
            }
        });
    } catch (error) {
        return res.status(500).send({ message: "Error logging in!", error });
    }
};

// Function to get daily logins
exports.getDailyLogins = async(req, res) => {
    try {
        // Find all users and their login and logout times
        const users = await User.find({}, { username: 1, loginTimes: 1, logoutTimes: 1 }); // Fetch only username, login times, and logout times

        // Map the users to format them for the response
        const formattedUsers = users.map((user) => ({
            username: user.username,
            loginTimes: user.loginTimes.map((time) => ({
                timestamp: time.timestamp,
                date: time.timestamp.toLocaleDateString(),
                time: time.timestamp.toLocaleTimeString(),
            })),
            logoutTimes: user.logoutTimes.map((time) => ({
                timestamp: time.timestamp,
                date: time.timestamp.toLocaleDateString(),
                time: time.timestamp.toLocaleTimeString(),
            })),
        }));

        res.status(200).send({
            message: "All login users fetched successfully",
            users: formattedUsers,
        });
    } catch (error) {
        console.error("Error fetching all logins", error);
        res.status(500).send({
            message: "Error fetching all logins",
            error,
        });
    }
};

exports.saveComment = async(req, res) => {
    try {
        const { userId, comment } = req.body;

        // Assuming you have a User model and you're updating the comments field
        const user = await User.findOne({ username: userId });
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Update the comments (you can modify the logic here as needed)
        user.comments = comment; // You may want to store comments in a different structure
        await user.save();

        res.status(200).send({
            message: "Comment saved successfully",
        });
    } catch (error) {
        console.error("Error saving comment", error);
        res.status(500).send({
            message: "Error saving comment",
            error,
        });
    }
};

exports.getDailyLogouts = async(req, res) => {
    try {
        // Get the current date and start of the day (00:00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find users who have logout times today
        const users = await User.find({
            "logoutTimes.timestamp": { $gte: today }, // Filter for logouts from today
        }, { username: 1, "logoutTimes.timestamp": 1 }); // Fetch only username and logout times

        res.status(200).send({
            message: "Daily logout users fetched successfully",
            users,
        });
    } catch (error) {
        console.error("Error fetching daily logouts", error);
        res.status(500).send({
            message: "Error fetching daily logouts",
            error,
        });
    }
};

// *********

exports.getUserDetails = async(req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user is already authenticated by verifying the token
        const token = req.headers.authorization;
        // console.log("authorization Token:", token);

        if (token) {
            try {
                const decodedToken = jwt.verify(token, process.env.JWT_KEY);
                // console.log("Decoded token:", decodedToken);

                // Optionally fetch the user details from the database using the decoded token
                const existingUser = await User.findById(decodedToken.userId);
                return res.status(200).send({
                    message: "User already authenticated",
                    user: existingUser, // Send existing user details
                    redirectTo: "/dashboard",
                });
            } catch (err) {
                // Token is invalid, proceed with login
                console.error("Invalid token", err);
            }
        }

        // Continue with login process
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).send({ message: "User not found" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.password
        );
        if (!isPasswordValid) {
            return res.status(401).send({ message: "Invalid password" });
        }

        // Send existing user details
        return res.status(200).send({
            message: "User details retrieved successfully",
            user: existingUser, // Send user details back
        });
    } catch (error) {
        console.error("Errosr fetching user details:", error);
        return res.status(500).send({ message: "Internal server error" });
    }
};

exports.logout = async(req, res) => {
    const { userId } = req.body; // Extract userId from request body

    // Check if userId is provided
    if (!userId) {
        return res.status(400).send({ message: "User ID not provided" });
    }

    try {
        // Find the user by ID
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).send({ message: "User not found" });
        }

        // Record logout time
        existingUser.logoutTimes.push({ timestamp: new Date() });
        await existingUser.save();

        return res.status(200).send({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).send({ message: "Error logging out", error });
    }
};

exports.sendOtp = async(req, res) => {
    const { email } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).send({ message: "User not found" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresIn = new Date(Date.now() + 10 * 60 * 1000);

        existingUser.otp = otp;
        existingUser.otpExpires = expiresIn;
        await existingUser.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}`,
        };

        // Use a promise-based approach for sending email
        transporter
            .sendMail(mailOptions)
            .then((info) => {
                console.log("Email sent: " + info.response);
                return res.status(200).send({ message: "OTP sent successfully" });
            })
            .catch((error) => {
                console.error("Error sending OTP email:", error);
                return res
                    .status(500)
                    .send({ message: "Error sending OTP email", error });
            });
    } catch (error) {
        console.error("Error during OTP generation:", error);
        return res.status(500).send({ message: "Error sending OTP", error });
    }
};

exports.verifyOtp = async(req, res) => {
    const { otp } = req.body;
    try {
        // Find the user based on OTP
        const existingUser = await User.findOne({ otp });

        if (!existingUser) {
            return res.status(400).send({ message: "Invalid OTP" });
        }

        if (existingUser.otpExpires < Date.now()) {
            return res.status(400).send({ message: "OTP has expired" });
        }

        // Clear OTP fields after successful verification
        existingUser.otp = null;
        existingUser.otpExpires = null;
        await existingUser.save();

        // Generate JWT token with user details
        const jwtToken = jwt.sign({
                userId: existingUser._id,
                email: existingUser.email,
                username: existingUser.username, // Include username in token payload if needed
                role: existingUser.role, // Include username in token payload if needed
            },
            process.env.JWT_KEY, { expiresIn: "12h" }
        );

        // Send success response with token and username
        return res.status(200).send({
            message: "OTP verified successfully",
            token: jwtToken,
            username: existingUser.username, // Add username to the response
            role: existingUser.role, // Add username to the response
        });

        // Optionally, set the token in cookies if needed
        res.cookie("token", jwtToken, {
            path: "/",
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
            httpOnly: true,
            sameSite: "lax",
        });
    } catch (error) {
        console.error("Error during OTP verification:", error);
        return res.status(500).send({ message: "Error verifying OTP", error });
    }
};

// user section on dashboard
exports.accessuser = async(req, res) => {
    const {
        fullname,
        mobile,
        email,
        password,
        date_of_hiring,
        designation,
        supervisor,
        salary,
        shift,
        other_designation,
    } = req.body;

    try {
        const existingUser = await AccessUser.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ message: "User already exists!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await AccessUser.create({
            fullname,
            mobile,
            email,
            password: hashedPassword,
            date_of_hiring,
            designation,
            supervisor,
            salary,
            shift,
            other_designation,
        });

        return res.status(201).send({ user });
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).send({ message: "Error signing up!", error });
    }
};

exports.getAllUsers = async(req, res) => {
    try {
        const users = await AccessUser.find(); // Retrieve all users
        return res.status(200).send({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).send({ message: "Error fetching users!", error });
    }
};

exports.viewUserById = async(req, res) => {
    // Validate user ID
    if (!res) {
        return res.status(400).send({ message: "Invalid user ID" });
    }

    const { id } = req.params;

    try {
        const user = await AccessUser.findById(id).select("-password"); // Exclude password from the response
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        return res.status(200).send({ user });
    } catch (error) {
        return handleError(res, error, "Error fetching user details");
    }
};

exports.updateUser = async(req, res) => {
    const { id } = req.params;
    const {
        fullname,
        mobile,
        password,
        date_of_hiring,
        designation,
        supervisor,
        salary,
        shift,
        other_designation,
    } = req.body;

    try {
        const existingUser = await AccessUser.findById(id);
        if (!existingUser) {
            return res.status(404).send({ message: "User not found!" });
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            existingUser.password = await bcrypt.hash(password, salt);
        }

        existingUser.fullname = fullname || existingUser.fullname;
        existingUser.mobile = mobile || existingUser.mobile;
        existingUser.date_of_hiring = date_of_hiring || existingUser.date_of_hiring;
        existingUser.designation = designation || existingUser.designation;
        existingUser.supervisor = supervisor || existingUser.supervisor;
        existingUser.salary = salary || existingUser.salary;
        existingUser.shift = shift || existingUser.shift;
        existingUser.other_designation =
            other_designation || existingUser.other_designation;

        const updatedUser = await existingUser.save();

        return res.status(200).send({ user: updatedUser });
    } catch (error) {
        console.error("Error during user update:", error);
        return res.status(500).send({ message: "Error updating user!", error });
    }
};

exports.updateUser = async(req, res) => {
    const { id } = req.params;
    const {
        fullname,
        mobile,
        password,
        date_of_hiring,
        designation,
        supervisor,
        salary,
        shift,
        other_designation,
    } = req.body;

    try {
        // Find the existing user by ID
        const existingUser = await AccessUser.findById(id);
        if (!existingUser) {
            return res.status(404).send({ message: "User not found!" });
        }

        // If a new password is provided, hash it before saving
        if (password) {
            const salt = await bcrypt.genSalt(10);
            existingUser.password = await bcrypt.hash(password, salt);
        }

        // Update the user details
        existingUser.fullname = fullname || existingUser.fullname;
        existingUser.mobile = mobile || existingUser.mobile;
        existingUser.date_of_hiring = date_of_hiring || existingUser.date_of_hiring;
        existingUser.designation = designation || existingUser.designation;
        existingUser.supervisor = supervisor || existingUser.supervisor;
        existingUser.salary = salary || existingUser.salary;
        existingUser.shift = shift || existingUser.shift;
        existingUser.other_designation =
            other_designation || existingUser.other_designation;

        // Save the updated user data
        const updatedUser = await existingUser.save();

        // Return the updated user
        return res.status(200).send({ user: updatedUser });
    } catch (error) {
        console.error("Error during user update:", error);
        return res.status(500).send({ message: "Error updating user!", error });
    }
};

exports.deleteUserById = async(req, res) => {
    const { id } = req.params;

    try {
        const user = await AccessUser.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        return res.status(200).send({ message: "User deleted successfully" });
    } catch (error) {
        return handleError(res, error, "Error deleting user");
    }
};

exports.inviteagency = async(req, res) => {
    const {
        company_name,
        company_type,
        vendor_profile,
        agency_id,
        country,
        state,
        city,
        pincode,
        address,
        primary_first_name,
        primary_last_name,
        primary_phone_no,
        primary_email,
        primary_designation,
        password,
        secondary_first_name,
        secondary_last_name,
        secondary_phone_no,
        secondary_email,
        secondary_designation,
    } = req.body;

    // Optional: Add validation with Joi here if needed

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newVendor = new Vendor({
            company_name,
            company_type,
            vendor_profile,
            agency_id,
            country,
            state,
            city,
            pincode,
            address,
            primary_first_name,
            primary_last_name,
            primary_phone_no,
            primary_email,
            primary_designation,
            password: hashedPassword,
            secondary_first_name,
            secondary_last_name,
            secondary_phone_no,
            secondary_email,
            secondary_designation,
        });

        await newVendor.save(); // Save the instance
        res.status(201).json({ message: "Vendor added successfully!" });
    } catch (error) {
        console.error("Error adding vendor:", error);
        res.status(500).json({ message: "Error adding vendor", error });
    }
};

exports.myAgencyData = async(req, res) => {
    try {
        const vendors = await Vendor.find(); // Retrieve all vendors from the database
        res.status(200).json(vendors); // Send the vendors as a JSON response
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ message: "Error fetching vendors", error });
    }
};
exports.viewAgencyById = async(req, res) => {
    const { id } = req.params; // Agency ID to update
    const {
        company_name,
        company_type,
        vendor_profile,
        country,
        state,
        city,
        pincode,
        address,
        primary_first_name,
        primary_last_name,
        primary_phone_no,
        primary_email,
        primary_designation,
        secondary_first_name,
        secondary_last_name,
        secondary_phone_no,
        secondary_email,
        secondary_designation,
    } = req.body;

    try {
        const updateData = {
            company_name,
            company_type,
            vendor_profile,
            country,
            state,
            city,
            pincode,
            address,
            primary_first_name,
            primary_last_name,
            primary_phone_no,
            primary_email,
            primary_designation,
            secondary_first_name,
            secondary_last_name,
            secondary_phone_no,
            secondary_email,
            secondary_designation,
        };

        // Update the vendor details in the database
        const updatedVendor = await Vendor.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        if (!updatedVendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        res.status(200).json({ message: "View Vedor Details", updatedVendor });
    } catch (error) {
        console.error("Error view vendor:", error);
        res.status(500).json({ message: "Error view vendor", error });
    }
};

exports.updateAgency = async(req, res) => {
    const { id } = req.params; // Agency ID to update
    const {
        company_name,
        company_type,
        vendor_profile,
        country,
        state,
        city,
        pincode,
        address,
        primary_first_name,
        primary_last_name,
        primary_phone_no,
        primary_email,
        primary_designation,
        secondary_first_name,
        secondary_last_name,
        secondary_phone_no,
        secondary_email,
        secondary_designation,
    } = req.body;

    // Optional: Add validation with Joi here if needed
    if (!id) {
        return res.status(400).json({ message: "Invalid agency ID" });
    }

    try {
        const updateData = {
            company_name,
            company_type,
            vendor_profile,
            country,
            state,
            city,
            pincode,
            address,
            primary_first_name,
            primary_last_name,
            primary_phone_no,
            primary_email,
            primary_designation,
            secondary_first_name,
            secondary_last_name,
            secondary_phone_no,
            secondary_email,
            secondary_designation,
        };

        // Update the vendor details in the database
        const updatedVendor = await Vendor.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        if (!updatedVendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        res
            .status(200)
            .json({ message: "Vendor updated successfully", updatedVendor });
    } catch (error) {
        console.error("Error updating vendor:", error);
        res.status(500).json({ message: "Error updating vendor", error });
    }
};

exports.deleteAgencyById = async(req, res) => {
    const { id } = req.params;

    try {
        const user = await Vendor.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).send({ message: "Vendor not found" });
        }
        return res.status(200).send({ message: "Vendor deleted successfully" });
    } catch (error) {
        return handleError(res, error, "Error deleting Vendor");
    }
};

// billing
// add client

exports.addClient = async(req, res) => {
    try {
        const newClient = new Client(req.body);
        await newClient.save();
        res.status(201).send(newClient);
    } catch (error) {
        res.status(400).send(error.message);
    }
};
// view client
exports.viewClient = async(req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).send(clients);
    } catch (error) {
        res.status(400).send(error.message);
    }
};
// view client details with id
exports.viewClientDetails = async(req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        res.status(200).send(client);
    } catch (error) {
        res.status(400).send(error.message);
    }
};
// update client
exports.updateClient = async(req, res) => {
    try {
        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true }
        );
        res.status(200).send(updatedClient);
    } catch (error) {
        res.status(400).send(error.message);
    }
};
exports.deleteClient = async(req, res) => {
    try {
        const deletedClient = await Client.findByIdAndDelete(req.params.id);
        res.status(200).send(deletedClient);
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Destination folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

// Multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
}).single("file");

const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).send({ message: "No token provided." });
    }

    const actualToken = token.split(" ")[1]; // Split to get the actual token after 'Bearer'

    jwt.verify(actualToken, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized! Invalid token." });
        }

        req.userId = decoded.id;
        next();
    });
};

exports.uploadCsv = [
    (req, res, next) => {
        upload(req, res, function(err) {
            if (err instanceof multer.MulterError) {
                return res
                    .status(400)
                    .json({ message: "Multer Error occurred during file upload." });
            } else if (err) {
                return res.status(400).json({ message: err.message });
            }
            next(); // Proceed to the next middleware
        });
    },
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUpload(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUpload(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        const newFile = new CompanySchema({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            status: [
                { userType: "Employee", checked: true },
                { userType: "Quality", checked: false },
                { userType: "Email Marketing", checked: false },
            ],
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}



exports.uploadCsvByTl = [
    (req, res, next) => {
        upload(req, res, function(err) {
            if (err instanceof multer.MulterError) {
                return res
                    .status(400)
                    .json({ message: "Multer Error occurred during file upload." });
            } else if (err) {
                return res.status(400).json({ message: err.message });
            }
            next(); // Proceed to the next middleware
        });
    },
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadbyTl(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadbyTl(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        const newFile = new RatlSChema({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            status: [
                { userType: "Employee", checked: true },
                { userType: "Quality", checked: false },
                { userType: "Email Marketing", checked: false },
            ],
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

exports.updateStatus = [
    async(req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validate the input
            if (!Array.isArray(status)) {
                return res
                    .status(400)
                    .send({ message: "Invalid status format. It should be an array." });
            }
            // Fetch the document by ID
            const campaign = await CompanySchema.findById(id);

            if (!campaign) {
                return res.status(404).send({ message: "Campaign not found." });
            }
            // Update the status field
            campaign.status = status;

            // Save the updated document
            await campaign.save();

            res.status(200).send({
                message: "Status updated successfully",
                campaign,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            res.status(500).send({ message: "Error updating status", error });
        }
    },
];



exports.updateStatusTl = async(req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Array.isArray(status)) {
            return res.status(400).send({ message: "Invalid status format. It should be an array." });
        }

        // Validate each status object
        for (const item of status) {
            if (!item.userType || typeof item.checked !== "boolean") {
                return res.status(400).send({ message: "Each status object must contain 'userType' (string) and 'checked' (boolean)." });
            }
        }

        const file = await RatlSChema.findById(id);

        if (!file) {
            return res.status(404).send({ message: "File not found." });
        }

        file.status = status; // Update status array

        await file.save();

        res.status(200).send({
            message: "Status updated successfully",
            file,
        });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).send({ message: "Internal server error while updating status", error });
    }
};




exports.deleteFile = [
    authenticateToken,
    async(req, res) => {
        try {
            const { id } = req.params;

            // Find the file by ID
            const file = await CompanySchema.findById(id);
            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Get the file path and ensure it's absolute
            const filePath = path.resolve(file.path);

            // Check if file exists before attempting to delete
            fs.access(filePath, fs.constants.F_OK, async(err) => {
                if (err) {
                    console.error("File not found at path:", filePath);
                    return res
                        .status(404)
                        .send({ message: "File not found on filesystem" });
                }

                try {
                    // Delete the file document from the database
                    await CompanySchema.findByIdAndDelete(id);

                    // Delete the file from the server's filesystem
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error("Error deleting file from filesystem:", unlinkErr);
                            return res.status(500).send({
                                message: "File deleted from DB, but error removing it from filesystem",
                                error: unlinkErr,
                            });
                        }
                        res.status(200).send({ message: "File deleted successfully" });
                    });
                } catch (deleteErr) {
                    console.error("Error deleting file from database:", deleteErr);
                    res
                        .status(500)
                        .send({ message: "Error deleting file from DB", error: deleteErr });
                }
            });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

const authenticateToken1 = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized. Token required." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).send({ message: "Unauthorized. Token missing." });
    }

    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized. Invalid token." });
        }

        // Attach userId to the request object
        req.userId = decoded.userId;
        next();
    });
};

exports.getCsvByRAFiles = [
    authenticateToken1, // Use the token verification middleware
    async(req, res) => {
        try {
            // Extract userId from the request object (assuming it's set in authenticateToken middleware)
            const { userId } = req;

            // console.log("userId", userId);
            // Find files associated with the userId
            const files = await CompanySchema.find({ userId });

            if (!files || files.length === 0) {
                return res
                    .status(404)
                    .send({ message: "No files found for this user." });
            }

            res.status(200).send({
                message: "Files retrieved successfully",
                files,
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

exports.getCsvFiles = [
    verifyToken, // Add token verification middleware here
    async(req, res) => {
        try {
            const files = await CompanySchema.find();

            if (!files || files.length === 0) {
                return res.status(404).send({ message: "No files found." });
            }

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files,
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

exports.getExcelFiles = async(req, res) => {
    const { fileId } = req.params;
    const filePath = path.join(__dirname, "uploads", `${fileId}.xlsx`); // Adjust the path as necessary

    if (fs.existsSync(filePath)) {
        try {
            // Read the Excel file
            const workbook = xlsx.readFile(filePath);
            const sheetNames = workbook.SheetNames;

            for (const sheetName of sheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const sheetData = xlsx.utils.sheet_to_json(sheet);

                // Save each sheet's data to MongoDB
                const excelData = new CompanySchema({
                    fileName: fileId,
                    sheetName,
                    data: sheetData,
                });
                await excelData.save();
            }

            res
                .status(200)
                .json({ success: true, message: "Excel data saved to database" });
        } catch (error) {
            console.error("Error processing the Excel file:", error);
            res
                .status(500)
                .json({ success: false, message: "Error processing the Excel file" });
        }
    } else {
        res.status(404).json({ success: false, message: "File not found" });
    }
};
// GET API to retrieve a specific CSV file by ID

exports.getCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await CompanySchema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", file.mimetype);
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", file.mimetype);
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

exports.downloadCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await CompanySchema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

exports.downloadCsvFileByIdRa = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await RatlSChema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];
// File update route

exports.updateCsvFileById = [
    verifyToken, // Token verification middleware
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const { filename, mimetype, path } = req.body;
            const fileData = req.file; // Assuming file is being uploaded

            // Find the existing file in the database
            const file = await CompanySchema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Update the filename and mimetype if provided
            if (filename) file.filename = filename;
            if (mimetype) file.mimetype = mimetype;

            // If a new file is uploaded, replace the existing content
            if (fileData) {
                // Replace the content in the database or replace the file on the filesystem
                file.content = fileData.buffer; // Store the new file's content
                file.path = null; // If you're storing file content in the database, reset path
            }

            // If a new file path is provided, update the path and clear content
            if (path) {
                if (!fs.existsSync(path)) {
                    return res
                        .status(400)
                        .send({ message: "Provided path does not exist." });
                }
                file.path = path; // Store the file's path in the database
                file.content = null; // Clear content if the file is stored on disk
            }

            // Save the updated file details
            await file.save();

            return res
                .status(200)
                .send({ message: "File updated successfully.", file });
        } catch (error) {
            console.error("Error updating file:", error);
            return res.status(500).send({ message: "Error updating file", error });
        }
    },
];

// operation team upload file

exports.uploadOperationCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByOperation(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadByOperation(req, res, userId) {
    try {
        const { campaignName, clientSelect, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode || !clientSelect) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new OperationCsvFile({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            clientSelect,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

exports.getCsvFilesByOperation = [
    authenticateToken1, // Add token verification middleware here
    async(req, res) => {
        const { userId } = req;
        try {
            const files = await OperationCsvFile.find({ userId });

            // if (!files || files.length === 0) {
            //     return res.status(404).send({ message: "No files found." });
            // }

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files,
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

exports.getCsvFilesByOperationAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await OperationCsvFile.find(); // Fetch all files

            if (!files || files.length === 0) {
                return res.status(404).send({ message: "No files found." });
            }

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

exports.getCsvFileByIdOperation = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await OperationCsvFile.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

exports.deleteOperationCsvFileById = [
    verifyToken, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await OperationCsvFile.findByIdAndDelete(id);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

// uplod RA Master File
exports.uploadRaMasterCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByRaMaster(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

exports.uploadRaTL = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByRatl(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

exports.getCsvFilesByRatlAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await RatlSChema.find(); // Fetch all files

            if (!files || files.length === 0) {
                return res.status(404).send({ message: "No files found." });
            }

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

exports.getCsvFileByIdtl = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await RatlSChema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

exports.deleteRatlCsvFileById = [
    verifyToken, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters


            // Find and delete the file by ID
            const file = await RatlSChema.findByIdAndDelete(id);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];





async function handleFileUploadByRatl(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new RatlSChema({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

async function handleFileUploadByRaMaster(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new RaMasterSChema({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

// getRAMaster csv File
exports.getCsvFilesByRAMasterAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await RaMasterSChema.find(); // Fetch all files

            if (!files || files.length === 0) {
                return res.status(404).send({ message: "No files found." });
            }

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

exports.getRaMasterCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await RaMasterSChema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

exports.deleteRaMasterCsvFileById = [
    authenticateToken1, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await RaMasterSChema.findByIdAndDelete(id);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

//Quality Checked Files

exports.uploadQualityCheckedCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByQualityChecked(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadByQualityChecked(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new QualityCheckedSChema({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

// getQualityChecked csv File
exports.getCsvFilesByQualityCheckedAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await QualityCheckedSChema.find(); // Fetch all files

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

//getquality check files by id
// exports.getQualityCheckedCsvFileById = [
//     authenticateToken1,
//     async(req, res) => {
//         try {
//             const { id } = req.params; // Get the ID from the request parameters
//             const file = await QualityCheckedSChema.findById(id); // Fetch the file by ID

//             res.status(200).send({
//                 message: "File retrieved successfully",
//                 file: file, // Ensure 'file' is the key expected by the frontend
//             });
//         } catch (error) {
//             console.error("Error retrieving file:", error);
//             res.status(500).send({ message: "Error retrieving file", error });
//         }
//     },
// ];

exports.getQualityCheckedCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await QualityCheckedSChema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];
//deletequality file delete

exports.deleteQualityCheckedCsvFileById = [
    authenticateToken1, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await QualityCheckedSChema.findByIdAndDelete(id);

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

// ***********************

// getqualitymaster csv file by id
exports.uploadQualityMasterCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByQualityMaster(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadByQualityMaster(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new QualityMasterCsvFile({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

//get quality master file data
exports.getCsvFilesByQualityMasterAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await QualityMasterCsvFile.find(); // Fetch all files

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

//get qualitymaster data by id

exports.getQualityMasterCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await QualityMasterCsvFile.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

//delete qualitymaster data by id
exports.deleteQualityMasterCsvFileById = [
    authenticateToken1, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await QualityMasterCsvFile.findByIdAndDelete(id);

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

//**********************************
// Email Marketing
exports.uploadEMCheckedCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                // Ensure a file has been uploaded
                if (!req.file) {
                    return res.status(400).send({ message: "No file uploaded." });
                }

                // Call the service to handle file upload
                try {
                    await handleFileUploadByEMChecked(req, res, userId);
                } catch (error) {
                    console.error("File upload failed:", error);
                    res.status(500).send({ message: "File upload failed", error });
                }
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadByEMChecked(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new EMCheckedSChema({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}
//getemData
exports.getCsvFilesByEMCheckedAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await EMCheckedSChema.find(); // Fetch all files

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

//get em data for id
// exports.getEMCheckedCsvFileById = [
//     authenticateToken1,
//     async(req, res) => {
//         try {
//             const { id } = req.params; // Get the ID from the request parameters
//             const file = await EMCheckedSChema.findById(id); // Fetch the file by ID

//             res.status(200).send({
//                 message: "File retrieved successfully",
//                 file: file, // Ensure 'file' is the key expected by the frontend
//             });
//         } catch (error) {
//             console.error("Error retrieving file:", error);
//             res.status(500).send({ message: "Error retrieving file", error });
//         }
//     },
// ];

exports.getEMCheckedCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await EMCheckedSChema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

//Delete EM Data By Id
exports.deleteEMCheckedCsvFileById = [
    authenticateToken1, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await EMCheckedSChema.findByIdAndDelete(id);

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];
//*********************************
//upload email master csv file
exports.uploadEMMasterCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByEMMaster(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadByEMMaster(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new UploadMasterEmCheckFile({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

//get email master data
exports.getCsvFilesByEMMasterAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await UploadMasterEmCheckFile.find(); // Fetch all files

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

//get em data by id

exports.getEMMasterCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await UploadMasterEmCheckFile.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

//delete EM Master file by id
exports.deleteEMMasterCsvFileById = [
    authenticateToken1, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await UploadMasterEmCheckFile.findByIdAndDelete(id);

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];
//***************************
//operation Master file
exports.operationMasterCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByOperationMaster(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadByOperationMaster(req, res, userId) {
    try {
        const { campaignName, clientSelect, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode || !clientSelect) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new OperationMasterFileSchema({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            clientSelect,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

//operation master file data get
exports.getCsvFilesByOpMasterAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await OperationMasterFileSchema.find(); // Fetch all files

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

//operation master file data get by id

exports.getOPMasterCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await OperationMasterFileSchema.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

//operation file data delete by id
exports.deleteOPMasterCsvFileById = [
    authenticateToken1, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await OperationMasterFileSchema.findByIdAndDelete(id);
            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

//unwanted Leads
exports.unwantedLeadsCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadByUnwantedLeads(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadByUnwantedLeads(req, res, userId) {
    try {
        const { campaignName, campaignCode } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode) {
            return res
                .status(400)
                .send({ message: "Missing campaign name or campaign code." });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new UnwantedLeads({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

//get unwanted leads
exports.getCsvFilesByUnwantedLeadsAll = [
    authenticateToken1,
    async(req, res) => {
        try {
            const files = await UnwantedLeads.find(); // Fetch all files

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

//get unwanted leads by id
exports.getUnwantedCsvFileById = [
    verifyToken, // Add token verification middleware if needed
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await UnwantedLeads.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

//elete unwanted leads
exports.deleteUnwantedCsvFileById = [
    authenticateToken1, // Middleware for authentication
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await UnwantedLeads.findByIdAndDelete(id);
            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

//upload Suppression and tal
exports.uploadSuppressionortalCsvFile = [
    upload, // Expecting a single file with field name 'file'
    async(req, res) => {
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token required." });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .send({ message: "Unauthorized. Token missing." });
            }

            jwt.verify(token, process.env.JWT_KEY, async(err, decoded) => {
                if (err) {
                    return res
                        .status(401)
                        .send({ message: "Unauthorized. Invalid token." });
                }

                const userId = decoded.userId;
                await handleFileUploadSupression(req, res, userId);
            });
        } catch (error) {
            console.error("Error in token validation:", error);
            res.status(500).send({
                message: "Internal server error during token validation",
                error,
            });
        }
    },
];

async function handleFileUploadSupression(req, res, userId) {
    try {
        const { campaignName, campaignCode, suppressionType } = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded." });
        }

        if (!campaignName || !campaignCode || !suppressionType) {
            return res
                .status(400)
                .send({
                    message: "Missing campaign name, campaign code, or suppression type.",
                });
        }

        const file = req.file;

        // Read file content
        let fileContent;
        try {
            fileContent = fs.readFileSync(file.path);
        } catch (readError) {
            console.error("Error reading file content:", readError);
            return res
                .status(500)
                .send({ message: "Error reading file content", error: readError });
        }

        // Create a new document in the database
        const newFile = new SuppressionOrTalFiles({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            content: fileContent,
            campaignName,
            campaignCode,
            suppressionType, // Store the suppression type here
            userId,
        });

        await newFile.save();

        res.status(200).send({
            message: "File uploaded and stored successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("Error uploading or storing file:", error);
        res.status(500).send({
            message: "Internal server error during file upload or storage",
            error,
        });
    }
}

exports.getCsvFilesByseppression = [
    async(req, res) => {
        try {
            const files = await SuppressionOrTalFiles.find(); // Fetch all files

            res.status(200).send({
                message: "Files retrieved successfully",
                files: files, // Ensure 'files' is the key expected by the frontend
            });
        } catch (error) {
            console.error("Error retrieving files:", error);
            res.status(500).send({ message: "Error retrieving files", error });
        }
    },
];

//sepparation file downnlod
exports.getSeparationCsvFileById = [
    async(req, res) => {
        try {
            const fileId = req.params.id;
            const file = await SuppressionOrTalFiles.findById(fileId);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            // Check if the content is stored in the database
            if (file.content && file.content.length > 0) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return res.send(file.content);
            }

            // Check if the file path is stored and the file exists on the filesystem
            if (file.path && fs.existsSync(file.path)) {
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${file.filename}"`
                );
                return fs.createReadStream(file.path).pipe(res);
            }

            // If neither the content nor the path is available
            return res.status(404).send({ message: "File content not found." });
        } catch (error) {
            console.error("Error retrieving file:", error);
            return res.status(500).send({ message: "Error retrieving file", error });
        }
    },
];

//delete file
exports.deleteSeparationCsvFileById = [
    async(req, res) => {
        try {
            const { id } = req.params; // Get the ID from the request parameters

            // Find and delete the file by ID
            const file = await SuppressionOrTalFiles.findByIdAndDelete(id);

            if (!file) {
                return res.status(404).send({ message: "File not found." });
            }

            res.status(200).send({ message: "File deleted successfully." });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send({ message: "Error deleting file", error });
        }
    },
];

// *********************************************************************************************************
// create campaign

const campaignStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/"); // Directory to save uploaded files
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append date to filename
    },
});

const uploadCampaign = multer({ storage: campaignStorage });

exports.createCampaign = [
    uploadCampaign.fields([
        { name: "assets", maxCount: 10 },
        { name: "script", maxCount: 10 },
        { name: "suppression", maxCount: 10 },
        { name: "tal", maxCount: 10 },
        { name: "suppressionList", maxCount: 10 },
        { name: "abmList", maxCount: 10 },
    ]),
    async(req, res) => {
        try {
            const processFiles = (files) => {
                return files ?
                    files.map((file) => ({
                        filename: file.filename,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        path: file.path,
                        content: fs.readFileSync(file.path), // Read file content
                    })) : [];
            };

            const campaign = new CampaignSchema({
                ...req.body,
                assets: processFiles(req.files["assets"]),
                script: processFiles(req.files["script"]),
                suppression: processFiles(req.files["suppression"]),
                tal: processFiles(req.files["tal"]),
                suppressionList: processFiles(req.files["suppressionList"]),
                abmList: processFiles(req.files["abmList"]),
            });

            const savedCampaign = await campaign.save();
            res.status(201).json(savedCampaign);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
];

// get all campaign data
exports.getAllCampaigns = async(req, res) => {
    try {
        // Retrieve all campaigns from the database
        const campaigns = await CampaignSchema.find();
        // Respond with the retrieved campaigns
        res.status(200).json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ message: "Error fetching campaigns", error });
    }
};

exports.updateCampaignById = [
    uploadCampaign.fields([ // Define fields for file uploads
        { name: "assets", maxCount: 10 },
        { name: "script", maxCount: 10 },
        { name: "suppression", maxCount: 10 },
        { name: "tal", maxCount: 10 },
        { name: "suppressionList", maxCount: 10 },
        { name: "abmList", maxCount: 10 },
    ]),

    async(req, res) => {
        try {
            const { id } = req.params; // Extract campaign ID from params
            const updateData = {}; // Object to hold data for update

            // Function to process files and add content (Buffer) to updateData
            const processFiles = (files) => {
                return files ?
                    files.map((file) => ({
                        filename: file.filename,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        path: file.path,
                        content: fs.readFileSync(file.path), // Store file content as Buffer
                    })) : [];
            };

            // Function to add files and their content to updateData object
            const addFilesToUpdateData = (fileType) => {
                if (req.files[fileType]) {
                    updateData[fileType] = processFiles(req.files[fileType]);
                }
            };

            // Add file data to updateData (assets, script, etc.)
            [
                "assets",
                "script",
                "suppression",
                "tal",
                "suppressionList",
                "abmList",
            ].forEach(addFilesToUpdateData);

            // Add non-file data (from req.body) to updateData
            const fieldsToUpdate = [
                "campaignName",
                "campaignCode",
                "startDate",
                "endDate",
                "campaignType",
                "campaignNature",
                "target",
                "leadPerDay",
                "voiceLogRequired",
                "billingDay",
                "cpl",
                "supervisor",
                "supervisorTarget",
                "template",
                "revenue",
                "companySize",
                "jobTitle",
                "geo",
                "industry",
                "note",
                "deliveryType",
                "deliveryDays",
                "contactsPerCampaign",
                "abmCpc",
                "nonAbmCpc",
                "noOfContacts",
            ];

            fieldsToUpdate.forEach((field) => {
                if (req.body[field]) {
                    updateData[field] = req.body[field]; // Update non-file fields
                }
            });

            // Fetch the existing campaign from the database
            const existingCampaign = await CampaignSchema.findById(id);

            if (!existingCampaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            // Merge new file data with the existing files data
            Object.keys(updateData).forEach((key) => {
                if (existingCampaign[key]) {
                    // If the field already contains files or data, append new data
                    updateData[key] = Array.isArray(existingCampaign[key]) ? [...existingCampaign[key], ...updateData[key]] :
                        updateData[key];
                }
            });

            // Find and update the campaign with the new data (both files and non-file)
            const updatedCampaign = await CampaignSchema.findByIdAndUpdate(id, updateData, { new: true });

            if (!updatedCampaign) {
                return res.status(404).json({ message: "Failed to update campaign" });
            }

            // Respond with the updated campaign
            res.status(200).json(updatedCampaign);
        } catch (error) {
            console.error("Error updating campaign:", error);
            res.status(500).json({ message: "Error updating campaign", error });
        }
    },
];

exports.getCampaignById = async(req, res) => {
    try {
        const { id } = req.params; // Extract the campaign ID from the request parameters

        // Find the campaign by ID
        const campaign = await CampaignSchema.findById(id);

        if (!campaign) {
            // If no campaign is found, respond with a 404 status and an error message
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Respond with the found campaign details
        res.status(200).json(campaign);
    } catch (error) {
        console.error("Error fetching campaign details:", error);
        res.status(500).json({ message: "Error fetching campaign details", error });
    }
};

exports.updateCampaignStatus = async(req, res) => {
    try {
        const { id } = req.params; // Extract the campaign ID from the request parameters
        const { status } = req.body; // Extract the new status from the request body

        // Find the campaign by ID and update its status
        const updatedCampaign = await CampaignSchema.findByIdAndUpdate(
            id, { campaignStatus: status }, // Update the status field
            { new: true, runValidators: true } // Return the updated document and run validators
        );

        if (!updatedCampaign) {
            // If no campaign is found, respond with a 404 status and an error message
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Respond with the updated campaign details
        res.status(200).json(updatedCampaign);
    } catch (error) {
        console.error("Error updating campaign status:", error);
        res.status(500).json({ message: "Error updating campaign status", error });
    }
};

const getMimeType = (extension) => {
    const mimeTypes = {
        ".pdf": "application/pdf",
        ".csv": "text/csv",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Add other MIME types as needed
    };
    return mimeTypes[extension] || "application/octet-stream";
};

exports.addTemplate = async(req, res) => {
    try {
        const newTemplate = new Template(req.body);
        await newTemplate.save();
        res.status(201).send(newTemplate);
    } catch (error) {
        res.status(400).send(error.message);
    }
};

exports.getTemplates = async(req, res) => {
    try {
        const templates = await Template.find(); // Fetch all templates
        res.status(200).json(templates); // Send the templates as a JSON response
    } catch (error) {
        res.status(500).send(error.message); // Handle any errors
    }
};

exports.getTemplateById = async(req, res) => {
    try {
        const templateId = req.params.id;
        const template = await Template.findById(templateId); // Fetch template by ID

        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        res.status(200).json(template); // Send the template as a JSON response
    } catch (error) {
        res.status(500).send(error.message); // Handle any errors
    }
};

// upload csv file in campaign
// *************************************************************************************************

// Invoice

exports.createInvoice = async(req, res) => {
    try {
        const newInvoice = new Invoice(req.body);
        await newInvoice.save();
        res
            .status(201)
            .json({ message: "Invoice created successfully", data: newInvoice });
    } catch (error) {
        res.status(500).json({ message: "Error creating invoice", error });
    }
};

exports.getInvoices = async(req, res) => {
    try {
        const invoices = await Invoice.find(); // Fetch all invoices
        res
            .status(200)
            .json({ message: "Invoices retrieved successfully", data: invoices });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving invoices", error });
    }
};

// GET request to retrieve a specific invoice by ID
exports.getInvoiceById = async(req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id); // Find invoice by ID
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res
            .status(200)
            .json({ message: "Invoice retrieved successfully", data: invoice });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving invoice", error });
    }
};
exports.deleteInvoiceById = async(req, res) => {
    try {
        const invoiceId = req.params.id; // Get the invoice ID from the request parameters
        const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId); // Delete the invoice by ID

        if (!deletedInvoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res
            .status(200)
            .json({ message: "Invoice deleted successfully", id: invoiceId });
    } catch (error) {
        res.status(500).json({ message: "Error deleting invoice", error });
    }
};

exports.saveMessage1 = [upload, async(req, res) => {
    try {
        const userId = req.user ? req.user._id : null; // Get userId from the session
        const { text, sender, time } = req.body;

        const message = new Message({
            text,
            sender,
            time: new Date(time),
            userId,
            file: req.file ? {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
            } : null,
        });

        await message.save();

        // Emit the saved message to all connected clients using Socket.IO
        req.app.get('io').emit('newMessage', message);

        res.status(201).json({
            message: 'Message saved successfully',
            data: message,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error saving message', error });
    }
}];


exports.getAllMessages = async(req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 }); // Get all messages sorted by creation date
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
};

{
    /*}  exports.eventsGet = async(req, res) => {
        try {
            const events = await Event.find();
            res.json(events);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    exports.eventsPost = async(req, res) => {
        try {
            const { title, start, end, type } = req.body;
            const newEvent = new Event({ title, start, end, type });
            await newEvent.save();
            res.status(201).json(newEvent);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } 
    */
}


exports.eventsPost = async(req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.status(201).send(event);
}

exports.eventsGet = async(req, res) => {
    const events = await Event.find();
    res.json(events);
}

exports.eventDelete = async(req, res) => {

    await Event.findByIdAndDelete(req.params.id);
    res.status(204).send();
}

exports.eventUpdate = async(req, res) => {
    const { title, type, start, end } = req.body;
    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id, { title, type, start, end }, { new: true }
        );
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update event' });
    }
};

exports.eventGetById = async(req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event details', error: error.message });
    }
};
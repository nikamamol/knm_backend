const express = require("express");
const cors = require("cors");
const UserAuthRouter = require("./src/routes/AuthRouter");
const dbConnect = require("./src/lib/connection");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Initialize Express app
const app = express();

// Middleware setup
app.use(cookieParser());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Integrate Socket.IO with the server
const io = socketIo(server, { cors: { origin: '*' } });

// Enable CORS for all routes (Modify as needed)
app.use(
    cors({
        origin: "*", // Replace with your allowed origin or specific domain
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    })
);

// Define your routes
app.use("/user", UserAuthRouter);

// Socket.IO connection handler
app.set('io', io);
io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });

    // You can add custom socket events here
    // Example: socket.on('event', data => { console.log(data); });
});

// Connect to the database
dbConnect();

// Start the server
server.listen(process.env.PORT || 4000, () => {
    console.log(`Server is running on port ${process.env.PORT || 4000}`);
});
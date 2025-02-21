const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    console.log("Extracted Token:", token);

    if (!token) {
        return res.status(401).send({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded; // Attach user info to request object
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return res.status(401).send({ message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;
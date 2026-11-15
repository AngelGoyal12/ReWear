const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please login to continue."
        });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.id) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email
        };

        next();
    } catch {
        return res.status(401).json({
            message: "Your session is invalid or expired. Please login again."
        });
    }
};

module.exports = authMiddleware;
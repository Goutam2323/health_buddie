// middleware/authMiddleware.js

// Middleware to check if user is authenticated
const ensureAuthenticated = (req, res, next) => {
    // Check if user is authenticated
    if (req.isAuthenticated()) {
        return next(); // User is authenticated, proceed to the next middleware/route handler
    }
    // User is not authenticated, send unauthorized status
    res.status(401).json({ message: 'Unauthorized' });
};

module.exports = { ensureAuthenticated };

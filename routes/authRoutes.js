const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authMiddleware'); // Import the authentication middleware

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Logout route
router.post('/logout', authController.logout);

// Save report route
router.post('/save-report', authController.saveReport);

// Forgot password route
router.post('/forgot', authController.forgotPassword);

// Reset password route (with OTP)
router.post('/reset-password', authController.resetPassword);

// Check authentication status route
router.get('/check-auth', authController.checkAuth);

// New route to fetch list of patients (protected by authentication)
router.get('/patient-list', ensureAuthenticated, authController.getPatientList);
// Add this new route to fetch reports of a specific patient
router.get('/patient-reports/:patientId', ensureAuthenticated, authController.getPatientReports);
// Route to check if user is logged in

router.get('/isLoggedIn', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isLoggedIn: true, username: req.user.username }); // Include username if logged in
    } else {
      res.json({ isLoggedIn: false });
    }
  });  


module.exports = router;

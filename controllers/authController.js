const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
exports.getPatientReports = async (req, res) => {
    try {
      const { patientId } = req.params;
      const user = await User.findById(req.user._id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const patient = user.patients.find(p => p.patientId === parseInt(patientId));
  
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
  
      res.status(200).json(patient.reports);
    } catch (err) {
      console.error('Error fetching patient reports:', err);
      res.status(500).json({ message: 'Error fetching patient reports' });
    }
  };
  
exports.getPatientList = async (req, res) => {
  try {
      // Ensure the user is authenticated and exists
      const user = await User.findById(req.user._id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Extract patient information from the user object
      const patients = user.patients.map(patient => ({
          patientId: patient.patientId,
          name: patient.name,
          age: patient.age,
          gender: patient.gender
      }));

      res.status(200).json(patients);
  } catch (err) {
      console.error('Error fetching patient list:', err);
      res.status(500).json({ message: 'Error fetching patient list' });
  }
};

exports.saveReport = async (req, res) => {
  try {
    const { patientId, pdfContent, summary, name, age, gender,test } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const patientIndex = user.patients.findIndex(p => p.patientId === parseInt(patientId));

    let fileName;
    let counter = 1;
    const baseFileName = `report_${patientId}`;

    const generateUniqueFileName = () => {
      return `${baseFileName}_${counter}.pdf`;
    };

    do {
      fileName = generateUniqueFileName();
      counter++;
    } while (fs.existsSync(path.join(__dirname, '..', 'pdf_reports', fileName)));

    const absoluteFilePath = path.join(__dirname, '..', 'pdf_reports', fileName);

    if (!fs.existsSync(path.dirname(absoluteFilePath))) {
      fs.mkdirSync(path.dirname(absoluteFilePath), { recursive: true });
    }

    const pdfBinary = Buffer.from(pdfContent, 'binary'); 

    // 2. Write the binary data to the file system
    fs.writeFileSync(absoluteFilePath, pdfBinary);
    if (patientIndex !== -1) {
      user.patients[patientIndex].reports.push({
        filePath: absoluteFilePath,
        test:test,
        summary: summary,
        generatedDate: new Date()
      });
    } else {
      user.patients.push({
        patientId: parseInt(patientId),
        name,
        age,
        gender,
        reports: [{
          filePath: absoluteFilePath,
          test:test,
          summary: summary,
          generatedDate: new Date()
        }]
      });
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Report saved successfully' });

  } catch (err) {
    console.error('Error saving report:', err);
    res.status(500).json({ message: 'Error saving report' });
  }
};

// ... rest of your server.js code ...


exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        req.login(user, err => {
            if (err) {
                return res.status(500).json({ message: 'Error logging in after registration' });
            }
            res.status(200).json({ message: 'User registered successfully', username: user.username });
        });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user' });
    }
};

exports.login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        req.logIn(user, err => {
            if (err) return next(err);
            res.status(200).json({ message: 'Login successful', username: user.username });
        });
    })(req, res, next);
};

exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        req.session.destroy(() => {
            res.status(200).json({ message: 'Logout successful' });
        });
    });
};



exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No user with that email' });

        const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
        user.resetPasswordToken = otp;
        const expiryTime = Date.now() + (3 * 60 * 1000); // 3 minutes
        user.resetPasswordExpires = expiryTime;
        await user.save();

        await sendEmail({
            email: user.email,
            subject: 'Password reset OTP',
            message: `Your OTP for password reset is: ${otp}`
        });

        res.status(200).json({ message: 'OTP sent successfully', expires: expiryTime });
    } catch (err) {
        res.status(500).json({ message: 'Error sending OTP' });
    }
};

exports.resetPassword = async (req, res) => {
    const { password, otp } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ message: 'Error resetting password' });
    }
};


exports.checkAuth = (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({ email: req.user.email, username: req.user.username });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
};

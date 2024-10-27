// models/user.js
const mongoose = require('mongoose');

// Define the schema for individual reports
const reportSchema = new mongoose.Schema({
  summary: { type: String, required: true },
  test: { type: String, required: true },
  generatedDate: { type: Date, default: Date.now },
  filePath: { type: String, required: true }
});

// Define the schema for patients
const patientSchema = new mongoose.Schema({
  patientId: { type: Number, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  reports: [reportSchema] // Embed the report schema
});

// Define the schema for the User (Doctor) model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  patients: [patientSchema] // Embed the patient schema
});

module.exports = mongoose.model('User', userSchema);

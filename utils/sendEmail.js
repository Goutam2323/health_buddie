const nodemailer = require("nodemailer");
require("dotenv").config();
const sendEmail = async (options, callback) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "bishtgoutam3@gmail.com", // your Gmail address
        pass: process.env.Email, // your Gmail password or App Password
      },
    });

    const mailOptions = {
      from: "bishtgoutam3@gmail.com", // sender address
      to: options.email, // receiver email
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");

    // If a callback is provided, invoke it
    if (callback) {
      callback(null);
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending OTP");
  }
};

module.exports = sendEmail;

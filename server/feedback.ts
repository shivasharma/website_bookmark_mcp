import nodemailer from "nodemailer";
import express from "express";

const router = express.Router();

// Load sensitive values from environment variables
const EMAIL_USER = process.env.FEEDBACK_EMAIL_USER;
const EMAIL_PASS = process.env.FEEDBACK_EMAIL_PASS;
const EMAIL_TO = process.env.FEEDBACK_EMAIL_TO || EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: "gmail", // or your email provider
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

router.post("/feedback", async (req, res) => {
  const { user_name, user_email, message } = req.body;
  if (!user_name || !user_email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    await transporter.sendMail({
      from: user_email,
      to: EMAIL_TO,
      subject: `Feedback from ${user_name}`,
      text: message,
      replyTo: user_email,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send feedback." });
  }
});

export default router;

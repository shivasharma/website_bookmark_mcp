import express from "express";
import emailjs from '@emailjs/nodejs';

const router = express.Router();

// These will be set from environment variables (GitHub Actions secrets)
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;

router.post("/feedback", async (req, res) => {
  const { user_name, user_email, message } = req.body;
  if (!user_name || !user_email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        user_name,
        user_email,
        message,
      },
      {
        publicKey: PUBLIC_KEY,
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send feedback." });
  }
});

export default router;

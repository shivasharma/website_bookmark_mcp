import express from "express";
const router = express.Router();
router.post("/feedback", (req, res) => {
    // Feedback endpoint placeholder: email sending removed
    res.json({ success: true, message: "Feedback received (email sending disabled)." });
});
export default router;

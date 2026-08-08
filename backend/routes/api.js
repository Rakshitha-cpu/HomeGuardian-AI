const express = require("express");
const router = express.Router();

// Health endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running"
  });
});

// Upload endpoint
router.post("/upload", (req, res) => {
  try {
    res.json({
      success: true,
      message: "File uploaded successfully",
      fileSize: "2.5 MB"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze endpoint
router.post("/analyze", (req, res) => {
  try {
    res.json({
      success: true,
      homeScore: 78,
      summary: "Home inspection analysis complete"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
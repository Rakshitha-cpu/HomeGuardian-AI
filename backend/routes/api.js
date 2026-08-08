const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running"
  });
});

router.post("/upload", (req, res) => {
  res.json({
    success: true,
    message: "File uploaded successfully",
    fileSize: "2.5 MB"
  });
});

router.post("/analyze", (req, res) => {
  res.json({
    success: true,
    homeScore: 78,
    summary: "Home inspection analysis complete"
  });
});

router.post("/login", (req, res) => {
  res.json({
    success: true,
    message: "Login successful"
  });
});

router.post("/register", (req, res) => {
  res.json({
    success: true,
    message: "Registration successful"
  });
});

module.exports = router;

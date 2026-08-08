const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// SERVE STATIC FRONTEND FILES
// =====================================================
app.use(express.static(path.join(__dirname, "../frontend")));

// =====================================================
// API ROUTES
// =====================================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running",
    currency: "INR (₹)",
    timestamp: new Date().toISOString()
  });
});

// Upload endpoint (mock)
app.post("/api/upload", (req, res) => {
  res.json({
    success: true,
    message: "File received",
    file: req.body.file || "sample.pdf"
  });
});

// Analyze endpoint (mock)
app.post("/api/analyze", (req, res) => {
  res.json({
    success: true,
    report: {
      homeScore: 78,
      issues: ["Old roof", "Foundation settling"],
      estimatedRepairs: "₹250,000 - ₹500,000"
    }
  });
});

// =====================================================
// SERVE INDEX.HTML FOR ALL OTHER ROUTES
// =====================================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// =====================================================
// ERROR HANDLER
// =====================================================
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("================================================");
  console.log("HomeGuardian AI Backend");
  console.log("Server running on port " + PORT);
  console.log("Health: http://localhost:" + PORT + "/api/health");
  console.log("Currency: INR (₹)");
  console.log("================================================");
});

module.exports = app;
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
// API ROUTES - HEALTH CHECK
// =====================================================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running",
    currency: "INR (₹)",
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// API ROUTES - FILE UPLOAD
// =====================================================
app.post("/api/upload", (req, res) => {
  console.log("Upload received:", req.body);
  res.json({
    success: true,
    message: "File uploaded successfully",
    file: req.body.file || "inspection_report.pdf",
    size: "2.5 MB",
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// API ROUTES - ANALYZE
// =====================================================
app.post("/api/analyze", (req, res) => {
  console.log("Analyze request received:", req.body);
  res.json({
    success: true,
    homeScore: 78,
    report: {
      homeHealth: "Good",
      issues: [
        { issue: "Old roof", severity: "High", estimate: "₹150,000" },
        { issue: "Foundation settling", severity: "Medium", estimate: "₹75,000" }
      ],
      totalEstimate: "₹225,000 - ₹500,000",
      recommendations: ["Replace roof within 2 years", "Monitor foundation cracks"]
    },
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// API ROUTES - LOGIN
// =====================================================
app.post("/api/login", (req, res) => {
  console.log("Login request received");
  res.json({
    success: true,
    message: "Login successful",
    user: {
      id: "user123",
      email: req.body.email || "user@example.com",
      name: "User"
    },
    token: "fake-jwt-token-12345"
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
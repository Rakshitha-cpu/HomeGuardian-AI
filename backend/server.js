const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ============================================================
// PORT
// ============================================================

const PORT = process.env.PORT || 4000;

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: "20mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDirectory = path.join(
  __dirname,
  "uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
  "/uploads",
  express.static(uploadDirectory)
);

// ============================================================
// ROOT
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running",
    currency: "INR",
    message: "HomeGuardian AI backend is running.",
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running",
    currency: "INR",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

const propertyRoutes = require("./routes/propertyRoutes");

app.use(
  "/api",
  propertyRoutes
);

// ============================================================
// AUTH ROUTES
// ============================================================

try {
  const authRoutes = require("./auth");

  app.use(
    "/api/auth",
    authRoutes
  );

  console.log(
    "Authentication routes loaded."
  );
} catch (error) {
  console.warn(
    "Authentication routes could not be loaded:",
    error.message
  );
}

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found.",
    path: req.originalUrl,
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(
      error.status || 500
    ).json({
      success: false,
      error:
        error.message ||
        "Internal server error.",
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    "================================================"
  );

  console.log(
    "HomeGuardian AI Backend"
  );

  console.log(
    `Server running on port ${PORT}`
  );

  console.log(
    `Health: http://localhost:${PORT}/api/health`
  );

  console.log(
    "Currency: INR (₹)"
  );

  console.log(
    "================================================"
  );
});
const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");

// Load environment variables
dotenv.config();

const app = express();

// =========================================================
// CONFIGURATION
// =========================================================

const PORT = process.env.PORT || 4000;

const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// =========================================================
// CREATE REQUIRED DIRECTORIES
// =========================================================

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, {
    recursive: true,
  });
}

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =========================================================
// STATIC FRONTEND
// =========================================================

// Serve frontend files
app.use(
  express.static(FRONTEND_DIR)
);

// Serve uploaded images/files
app.use(
  "/uploads",
  express.static(UPLOADS_DIR)
);

// =========================================================
// ROOT ROUTE
// =========================================================

app.get("/", (req, res) => {
  const indexPath = path.join(
    FRONTEND_DIR,
    "index.html"
  );

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.json({
    success: true,
    application: "HomeGuardian AI",
    message: "HomeGuardian AI backend is running",
  });
});

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running",
    currency: "INR",
    timestamp: new Date().toISOString(),
  });
});

// =========================================================
// API ROUTES
// =========================================================

let apiRoutes;

try {
  apiRoutes = require("./routes/api");

  app.use(
    "/api",
    apiRoutes
  );

  console.log("✅ API routes loaded successfully.");
} catch (error) {
  console.error(
    "❌ Could not load ./routes/api.js"
  );

  console.error(error.message);

  // Keep server running so frontend can still open
  app.use("/api", (req, res) => {
    res.status(500).json({
      success: false,
      error:
        "API routes could not be loaded.",
      details: error.message,
    });
  });
}

// =========================================================
// DASHBOARD ROUTE
// =========================================================

app.get("/dashboard", (req, res) => {
  const dashboardPath = path.join(
    FRONTEND_DIR,
    "dashboard.html"
  );

  if (!fs.existsSync(dashboardPath)) {
    return res.status(404).send(
      "dashboard.html not found"
    );
  }

  return res.sendFile(
    dashboardPath
  );
});

// =========================================================
// LOGIN ROUTE
// =========================================================

app.get("/login", (req, res) => {
  const loginPath = path.join(
    FRONTEND_DIR,
    "login.html"
  );

  if (!fs.existsSync(loginPath)) {
    return res.status(404).send(
      "login.html not found"
    );
  }

  return res.sendFile(loginPath);
});

// =========================================================
// REGISTER ROUTE
// =========================================================

app.get("/register", (req, res) => {
  const registerPath = path.join(
    FRONTEND_DIR,
    "register.html"
  );

  if (!fs.existsSync(registerPath)) {
    return res.status(404).send(
      "register.html not found"
    );
  }

  return res.sendFile(
    registerPath
  );
});

// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
});

// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Server error:",
      error
    );

    res.status(
      error.status || 500
    ).json({
      success: false,
      error:
        error.message ||
        "Internal server error",
    });
  }
);

// =========================================================
// START SERVER
// =========================================================

app.listen(
  PORT,
  () => {
    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "       HOMEGUARDIAN AI"
    );
    console.log(
      "======================================"
    );
    console.log(
      `🚀 Server running on: http://localhost:${PORT}`
    );
    console.log(
      `🏠 Frontend: http://localhost:${PORT}/`
    );
    console.log(
      `📊 Dashboard: http://localhost:${PORT}/dashboard.html`
    );
    console.log(
      `❤️ Health: http://localhost:${PORT}/health`
    );
    console.log(
      `🔌 API: http://localhost:${PORT}/api`
    );
    console.log(
      "======================================"
    );
    console.log("");
  }
);
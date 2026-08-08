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

const PORT = Number(process.env.PORT) || 4000;
const HOST = "0.0.0.0";

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

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =========================================================
// STATIC FRONTEND
// =========================================================

app.use(express.static(FRONTEND_DIR));

// =========================================================
// STATIC UPLOADED FILES
// =========================================================

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
    environment:
      process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// =========================================================
// API ROUTES
// =========================================================

try {
  const apiRoutes = require("./routes/api");

  app.use(
    "/api",
    apiRoutes
  );

  console.log(
    "✅ API routes loaded successfully."
  );
} catch (error) {
  console.error(
    "❌ Could not load ./routes/api.js"
  );

  console.error(error);

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
// AUTH ROUTES
// =========================================================

try {
  const authRoutes = require("./routes/auth");

  app.use(
    "/api/auth",
    authRoutes
  );

  console.log(
    "✅ Authentication routes loaded successfully."
  );
} catch (error) {
  console.warn(
    "⚠️ Authentication routes not loaded."
  );

  console.warn(
    error.message
  );
}

// =========================================================
// DASHBOARD ROUTE
// =========================================================

app.get(
  "/dashboard",
  (req, res) => {
    const dashboardPath =
      path.join(
        FRONTEND_DIR,
        "dashboard.html"
      );

    if (
      !fs.existsSync(
        dashboardPath
      )
    ) {
      return res
        .status(404)
        .send(
          "dashboard.html not found"
        );
    }

    return res.sendFile(
      dashboardPath
    );
  }
);

// =========================================================
// LOGIN ROUTE
// =========================================================

app.get(
  "/login",
  (req, res) => {
    const loginPath =
      path.join(
        FRONTEND_DIR,
        "login.html"
      );

    if (
      !fs.existsSync(
        loginPath
      )
    ) {
      return res
        .status(404)
        .send(
          "login.html not found"
        );
    }

    return res.sendFile(
      loginPath
    );
  }
);

// =========================================================
// REGISTER ROUTE
// =========================================================

app.get(
  "/register",
  (req, res) => {
    const registerPath =
      path.join(
        FRONTEND_DIR,
        "register.html"
      );

    if (
      !fs.existsSync(
        registerPath
      )
    ) {
      return res
        .status(404)
        .send(
          "register.html not found"
        );
    }

    return res.sendFile(
      registerPath
    );
  }
);

// =========================================================
// PDF ROUTE SUPPORT
// =========================================================
//
// The actual PDF endpoint should be registered
// inside routes/api.js.
//
// Example:
//
// GET /api/reports/:id/pdf
//
// This server.js simply forwards /api requests
// to routes/api.js.
//
// =========================================================

// =========================================================
// 404 HANDLER
// =========================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      error: "Not found",
      path: req.originalUrl,
    });
  }
);

// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "❌ Server error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    res
      .status(
        error.status || 500
      )
      .json({
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
  HOST,
  () => {
    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "          HOMEGUARDIAN AI"
    );
    console.log(
      "======================================"
    );

    console.log(
      `🚀 Server listening on ${HOST}:${PORT}`
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
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const agents = require("../agents");
const { generatePropertyPDF } = require("../pdfGenerator");

const router = express.Router();

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);

// Create uploads folder automatically
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// ============================================================
// MULTER CONFIGURATION
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const filename =
      `${uuidv4()}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    files: 20,
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "video/mp4",
      "application/pdf",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Please upload JPG, PNG, WEBP, MP4 or PDF."
        )
      );
    }
  },
});

// ============================================================
// IN-MEMORY REPORT STORE
// ============================================================

const reports = new Map();

// ============================================================
// HEALTH CHECK
// GET /api/health
// ============================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "HomeGuardian AI",
    status: "running",
    currency: "INR",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// UPLOAD PROPERTY FILES
// POST /api/upload
// ============================================================

router.post(
  "/upload",
  upload.array("files", 20),
  (req, res) => {
    try {
      const files = (req.files || []).map((file) => ({
        id: file.filename,
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimetype,
        path: file.path,
      }));

      return res.json({
        success: true,
        uploaded: files.length,
        files,
      });
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to upload files.",
        details: error.message,
      });
    }
  }
);

// ============================================================
// ANALYZE PROPERTY
// POST /api/analyze
// ============================================================

router.post("/analyze", (req, res) => {
  try {
    const {
      address,
      uploadedFileCount,
      budgetCap,
    } = req.body || {};

    const parsedFileCount =
      Number(uploadedFileCount) || 0;

    const parsedBudget =
      budgetCap !== undefined &&
      budgetCap !== null &&
      budgetCap !== ""
        ? Number(budgetCap)
        : null;

    const report =
      agents.runOrchestration({
        address:
          address || "Unknown address",

        uploadedFileCount:
          parsedFileCount,

        budgetCap:
          parsedBudget,
      });

    const reportId = uuidv4();

    reports.set(
      reportId,
      report
    );

    return res.json({
      success: true,
      reportId,
      ...report,
    });
  } catch (error) {
    console.error(
      "Analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Failed to generate property analysis.",
      details: error.message,
    });
  }
});

// ============================================================
// GET COMPLETE REPORT
// GET /api/reports/:id
// ============================================================

router.get(
  "/reports/:id",
  (req, res) => {
    try {
      const report =
        reports.get(
          req.params.id
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          error: "Report not found.",
        });
      }

      return res.json({
        success: true,
        ...report,
      });
    } catch (error) {
      console.error(
        "Report error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch report.",
      });
    }
  }
);

// ============================================================
// HOME HEALTH
// GET /api/reports/:id/health
// ============================================================

router.get(
  "/reports/:id/health",
  (req, res) => {
    try {
      const report =
        reports.get(
          req.params.id
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          error: "Report not found.",
        });
      }

      return res.json({
        success: true,

        homeHealthScore:
          report.homeHealthScore,

        healthStatus:
          report.healthStatus || null,

        systemScores:
          report.systemScores || {},

        updatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Health error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch property health.",
      });
    }
  }
);

// ============================================================
// DOWNLOAD PDF REPORT
// GET /api/reports/:id/pdf
// ============================================================

router.get(
  "/reports/:id/pdf",
  (req, res) => {
    try {
      const report =
        reports.get(
          req.params.id
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          error: "Report not found.",
        });
      }

      console.log(
        `Generating PDF for report: ${req.params.id}`
      );

      return generatePropertyPDF(
        report,
        res
      );
    } catch (error) {
      console.error(
        "PDF generation error:",
        error
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error:
            "Failed to generate PDF.",
          details: error.message,
        });
      }
    }
  }
);

// ============================================================
// VISION INSPECTION AGENT
// POST /api/agents/vision-inspection
// ============================================================

router.post(
  "/agents/vision-inspection",
  (req, res) => {
    try {
      const result =
        agents.visionInspectionAgent(
          1,
          Number(
            req.body?.uploadedFileCount
          ) || 0
        );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error:
          "Vision inspection failed.",
        details: error.message,
      });
    }
  }
);

// ============================================================
// STRUCTURAL RISK AGENT
// POST /api/agents/structural-risk
// ============================================================

router.post(
  "/agents/structural-risk",
  (req, res) => {
    try {
      const result =
        agents.structuralRiskAgent(
          1,
          {}
        );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error:
          "Structural risk analysis failed.",
        details: error.message,
      });
    }
  }
);

// ============================================================
// PROPERTY HEALTH AGENT
// POST /api/agents/property-health
// ============================================================

router.post(
  "/agents/property-health",
  (req, res) => {
    try {
      const result =
        agents.propertyHealthAgent(
          1
        );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error:
          "Property health analysis failed.",
        details: error.message,
      });
    }
  }
);

// ============================================================
// COST INTELLIGENCE AGENT
// POST /api/agents/cost-intelligence
// ============================================================

router.post(
  "/agents/cost-intelligence",
  (req, res) => {
    try {
      const result =
        agents.costIntelligenceAgent(
          [],
          []
        );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error:
          "Cost intelligence failed.",
        details: error.message,
      });
    }
  }
);

// ============================================================
// VENDOR INTELLIGENCE AGENT
// POST /api/agents/vendor-intelligence
// ============================================================

router.post(
  "/agents/vendor-intelligence",
  (req, res) => {
    try {
      const result =
        agents.vendorIntelligenceAgent();

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error:
          "Vendor intelligence failed.",
        details: error.message,
      });
    }
  }
);

// ============================================================
// ERROR HANDLER FOR MULTER
// ============================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof multer.MulterError
    ) {
      return res.status(400).json({
        success: false,
        error:
          `Upload error: ${error.message}`,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    next();
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
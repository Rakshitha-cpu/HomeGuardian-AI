const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const agents = require("../agents");
const { generatePropertyPDF } = require("../pdfGenerator");

const router = express.Router();

/* ============================================================
   CONFIGURATION
   ============================================================ */

const MAX_FILES = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/*
 * IMPORTANT:
 * Render has an ephemeral filesystem.
 * Uploaded files are used during the current request/session.
 * Do not treat the uploads folder as permanent storage.
 */

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

/* ============================================================
   MULTER STORAGE
   ============================================================ */

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname).toLowerCase();

        const filename =
            `${uuidv4()}${extension}`;

        cb(null, filename);
    }

});


/* ============================================================
   ALLOWED FILE TYPES
   ============================================================ */

const allowedMimeTypes = [

    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",

    "video/mp4",
    "video/quicktime",
    "video/webm",

    "application/pdf"

];


const upload = multer({

    storage,

    limits: {
        files: MAX_FILES,
        fileSize: MAX_FILE_SIZE
    },

    fileFilter: function (req, file, cb) {

        if (allowedMimeTypes.includes(file.mimetype)) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Unsupported file type. Please upload JPG, PNG, WEBP, HEIC, MP4, MOV, WEBM or PDF."
                )
            );

        }

    }

});


/* ============================================================
   TEMPORARY REPORT STORE
   ============================================================ */

const reports = new Map();


/* ============================================================
   HEALTH CHECK
   GET /api/health
   ============================================================ */

router.get("/health", function (req, res) {

    return res.json({

        success: true,

        service: "HomeGuardian AI",

        status: "running",

        currency: "INR",

        currencySymbol: "₹",

        timestamp: new Date().toISOString()

    });

});


/* ============================================================
   UPLOAD PROPERTY FILES
   POST /api/upload
   ============================================================ */

router.post(
    "/upload",
    upload.array("files", MAX_FILES),
    function (req, res) {

        try {

            const uploadedFiles =
                (req.files || []).map(function (file) {

                    return {

                        id: file.filename,

                        originalName:
                            file.originalname,

                        filename:
                            file.filename,

                        size:
                            file.size,

                        mimeType:
                            file.mimetype,

                        path:
                            file.path

                    };

                });


            return res.json({

                success: true,

                uploaded:
                    uploadedFiles.length,

                currency:
                    "INR",

                files:
                    uploadedFiles

            });

        } catch (error) {

            console.error(
                "Upload error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to upload files.",

                details:
                    error.message

            });

        }

    }
);


/* ============================================================
   ANALYZE PROPERTY
   POST /api/analyze
   ============================================================ */

router.post(
    "/analyze",
    async function (req, res) {

        try {

            const {
                address,
                uploadedFileCount,
                budgetCap
            } = req.body || {};


            const parsedFileCount =
                Number(uploadedFileCount) || 0;


            let parsedBudget = null;


            if (
                budgetCap !== undefined &&
                budgetCap !== null &&
                budgetCap !== ""
            ) {

                parsedBudget =
                    Number(
                        String(budgetCap)
                            .replace(/,/g, "")
                            .replace(/₹/g, "")
                            .trim()
                    );

            }


            const report =
                agents.runOrchestration({

                    address:
                        address ||
                        "Unknown address",

                    uploadedFileCount:
                        parsedFileCount,

                    budgetCap:
                        parsedBudget

                });


            const reportId =
                uuidv4();


            /*
             * Force INR metadata into the report.
             */

            const finalReport = {

                ...report,

                reportId,

                currency:
                    "INR",

                currencySymbol:
                    "₹",

                generatedAt:
                    new Date().toISOString()

            };


            reports.set(
                reportId,
                finalReport
            );


            return res.json({

                success: true,

                reportId,

                currency:
                    "INR",

                currencySymbol:
                    "₹",

                ...finalReport

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

                details:
                    error.message

            });

        }

    }
);


/* ============================================================
   GET COMPLETE REPORT
   GET /api/reports/:id
   ============================================================ */

router.get(
    "/reports/:id",
    function (req, res) {

        try {

            const report =
                reports.get(
                    req.params.id
                );


            if (!report) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Report not found. The Render server may have restarted and cleared temporary reports."

                });

            }


            return res.json({

                success: true,

                currency:
                    "INR",

                currencySymbol:
                    "₹",

                ...report

            });

        } catch (error) {

            console.error(
                "Report error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to fetch report."

            });

        }

    }
);


/* ============================================================
   HOME HEALTH
   GET /api/reports/:id/health
   ============================================================ */

router.get(
    "/reports/:id/health",
    function (req, res) {

        try {

            const report =
                reports.get(
                    req.params.id
                );


            if (!report) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Report not found."

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

                currency:
                    "INR",

                currencySymbol:
                    "₹",

                updatedAt:
                    new Date().toISOString()

            });

        } catch (error) {

            console.error(
                "Health error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to fetch property health."

            });

        }

    }
);


/* ============================================================
   DOWNLOAD PDF REPORT
   GET /api/reports/:id/pdf
   ============================================================ */

router.get(
    "/reports/:id/pdf",
    async function (req, res) {

        try {

            const report =
                reports.get(
                    req.params.id
                );


            if (!report) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Report not found."

                });

            }


            /*
             * Make sure the PDF generator receives
             * the INR information.
             */

            const pdfReport = {

                ...report,

                currency:
                    "INR",

                currencySymbol:
                    "₹"

            };


            console.log(
                `Generating INR PDF for report: ${req.params.id}`
            );


            return generatePropertyPDF(
                pdfReport,
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
                        "Failed to generate PDF report.",

                    details:
                        error.message

                });

            }

        }

    }
);


/* ============================================================
   VISION INSPECTION AGENT
   POST /api/agents/vision-inspection
   ============================================================ */

router.post(
    "/agents/vision-inspection",
    function (req, res) {

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

                ...result

            });

        } catch (error) {

            console.error(
                "Vision inspection error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Vision inspection failed.",

                details:
                    error.message

            });

        }

    }
);


/* ============================================================
   STRUCTURAL RISK AGENT
   POST /api/agents/structural-risk
   ============================================================ */

router.post(
    "/agents/structural-risk",
    function (req, res) {

        try {

            const result =
                agents.structuralRiskAgent(

                    1,

                    {}

                );


            return res.json({

                success: true,

                ...result

            });

        } catch (error) {

            console.error(
                "Structural risk error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Structural risk analysis failed.",

                details:
                    error.message

            });

        }

    }
);


/* ============================================================
   PROPERTY HEALTH AGENT
   POST /api/agents/property-health
   ============================================================ */

router.post(
    "/agents/property-health",
    function (req, res) {

        try {

            const result =
                agents.propertyHealthAgent(
                    1
                );


            return res.json({

                success: true,

                ...result

            });

        } catch (error) {

            console.error(
                "Property health error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Property health analysis failed.",

                details:
                    error.message

            });

        }

    }
);


/* ============================================================
   COST INTELLIGENCE AGENT
   POST /api/agents/cost-intelligence
   ============================================================ */

router.post(
    "/agents/cost-intelligence",
    function (req, res) {

        try {

            const result =
                agents.costIntelligenceAgent(

                    [],

                    []

                );


            return res.json({

                success: true,

                currency:
                    "INR",

                currencySymbol:
                    "₹",

                ...result

            });

        } catch (error) {

            console.error(
                "Cost intelligence error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Cost intelligence failed.",

                details:
                    error.message

            });

        }

    }
);


/* ============================================================
   VENDOR INTELLIGENCE AGENT
   POST /api/agents/vendor-intelligence
   ============================================================ */

router.post(
    "/agents/vendor-intelligence",
    function (req, res) {

        try {

            const result =
                agents.vendorIntelligenceAgent();


            return res.json({

                success: true,

                currency:
                    "INR",

                currencySymbol:
                    "₹",

                ...result

            });

        } catch (error) {

            console.error(
                "Vendor intelligence error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Vendor intelligence failed.",

                details:
                    error.message

            });

        }

    }
);


/* ============================================================
   MULTER / UPLOAD ERROR HANDLER
   ============================================================ */

router.use(
    function (error, req, res, next) {

        if (
            error instanceof multer.MulterError
        ) {

            return res.status(400).json({

                success: false,

                error:
                    `Upload error: ${error.message}`

            });

        }


        if (error) {

            return res.status(400).json({

                success: false,

                error:
                    error.message

            });

        }


        next();

    }
);


/* ============================================================
   EXPORT
   ============================================================ */

module.exports = router;
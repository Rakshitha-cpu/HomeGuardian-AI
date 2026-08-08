const PDFDocument = require("pdfkit");

// ============================================================
// CURRENCY — INDIAN RUPEES
// ============================================================

function formatINR(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// SAFE VALUE
// ============================================================

function safe(value, fallback = "Not available") {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
}

// ============================================================
// DRAW SECTION TITLE
// ============================================================

function sectionTitle(doc, title) {
  doc
    .moveDown(0.8)
    .fontSize(16)
    .fillColor("#6D4AFF")
    .font("Helvetica-Bold")
    .text(title);

  doc
    .moveTo(50, doc.y + 5)
    .lineTo(545, doc.y + 5)
    .strokeColor("#DDDDDD")
    .stroke();

  doc.moveDown(0.5);
}

// ============================================================
// DRAW KEY / VALUE
// ============================================================

function keyValue(doc, label, value) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#333333")
    .text(`${label}: `, {
      continued: true,
    });

  doc
    .font("Helvetica")
    .fillColor("#555555")
    .text(safe(value));

  doc.moveDown(0.2);
}

// ============================================================
// DRAW SCORE
// ============================================================

function drawScore(doc, score) {
  const numericScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  doc
    .roundedRect(50, doc.y, 495, 70, 8)
    .fillColor("#F5F3FF")
    .fill();

  const startY = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#666666")
    .text("HOME HEALTH SCORE", 70, startY + 14);

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#6D4AFF")
    .text(`${numericScore}/100`, 70, startY + 30);

  doc.moveDown(4);
}

// ============================================================
// DRAW SYSTEM SCORE
// ============================================================

function drawSystemScore(doc, name, score) {
  const numericScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333333")
    .text(name, 60, doc.y);

  doc.text(`${numericScore}/100`, 470, doc.y - 12);

  doc
    .roundedRect(60, doc.y + 2, 400, 8, 4)
    .fillColor("#E5E7EB")
    .fill();

  doc
    .roundedRect(
      60,
      doc.y + 2,
      400 * (numericScore / 100),
      8,
      4
    )
    .fillColor("#6D4AFF")
    .fill();

  doc.moveDown(1.2);
}

// ============================================================
// MAIN PDF GENERATOR
// ============================================================

function generatePropertyPDF(report, res) {
  try {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    // --------------------------------------------------------
    // RESPONSE HEADERS
    // --------------------------------------------------------

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="HomeGuardian-AI-Report.pdf"'
    );

    // --------------------------------------------------------
    // PIPE PDF TO RESPONSE
    // --------------------------------------------------------

    doc.pipe(res);

    // --------------------------------------------------------
    // REPORT DATA
    // --------------------------------------------------------

    const address =
      report?.address ||
      "Unknown address";

    const homeHealthScore =
      report?.homeHealthScore ??
      report?.overallScore ??
      0;

    const healthStatus =
      report?.healthStatus ||
      "Analysis completed";

    const systemScores =
      report?.systemScores ||
      {};

    const repairs =
      Array.isArray(report?.repairs)
        ? report.repairs
        : Array.isArray(report?.repairPriority)
        ? report.repairPriority
        : [];

    const vendors =
      Array.isArray(report?.vendors)
        ? report.vendors
        : Array.isArray(report?.vendorMatches)
        ? report.vendorMatches
        : [];

    const negotiation =
      Array.isArray(report?.negotiation)
        ? report.negotiation
        : Array.isArray(report?.negotiationPoints)
        ? report.negotiationPoints
        : [];

    const costForecast =
      Array.isArray(report?.costForecast)
        ? report.costForecast
        : Array.isArray(report?.fiveYearForecast)
        ? report.fiveYearForecast
        : [];

    // ========================================================
    // HEADER
    // ========================================================

    doc
      .font("Helvetica-Bold")
      .fontSize(26)
      .fillColor("#111827")
      .text("HomeGuardian AI");

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#6B7280")
      .text("Home Intelligence Report");

    doc.moveDown(0.8);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#6D4AFF")
      .lineWidth(2)
      .stroke();

    doc.moveDown(1);

    // ========================================================
    // PROPERTY INFORMATION
    // ========================================================

    sectionTitle(
      doc,
      "Property Information"
    );

    keyValue(
      doc,
      "Address",
      address
    );

    keyValue(
      doc,
      "Report Status",
      healthStatus
    );

    keyValue(
      doc,
      "Generated",
      new Date().toLocaleString("en-IN")
    );

    // ========================================================
    // HOME HEALTH
    // ========================================================

    sectionTitle(
      doc,
      "Home Health"
    );

    drawScore(
      doc,
      homeHealthScore
    );

    // ========================================================
    // SYSTEM SCORES
    // ========================================================

    sectionTitle(
      doc,
      "System Health"
    );

    const systemEntries = [
      ["Roof", systemScores.roof],
      [
        "Foundation / Structure",
        systemScores.foundation ||
          systemScores.structure,
      ],
      ["Plumbing", systemScores.plumbing],
      ["Electrical", systemScores.electrical],
      ["HVAC", systemScores.hvac],
      [
        "Exterior / Envelope",
        systemScores.exterior ||
          systemScores.envelope,
      ],
    ];

    let hasSystemScores = false;

    systemEntries.forEach(
      ([name, score]) => {
        if (
          score !== undefined &&
          score !== null
        ) {
          hasSystemScores = true;

          drawSystemScore(
            doc,
            name,
            score
          );
        }
      }
    );

    if (!hasSystemScores) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666666")
        .text(
          "System-level scores were not available."
        );
    }

    // ========================================================
    // REPAIR PRIORITY
    // ========================================================

    sectionTitle(
      doc,
      "Repair Priority"
    );

    if (repairs.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666666")
        .text(
          "No repair recommendations available."
        );
    } else {
      repairs.forEach(
        (repair, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }

          const item =
            repair.item ||
            repair.name ||
            repair.description ||
            `Repair ${index + 1}`;

          const system =
            repair.system ||
            "General";

          const priority =
            repair.priority ||
            repair.urgency ||
            "Plan ahead";

          const cost =
            repair.cost ??
            repair.estimatedCost ??
            repair.estimated_cost ??
            0;

          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#111827")
            .text(`${index + 1}. ${item}`);

          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#555555")
            .text(
              `System: ${system}   |   Priority: ${priority}   |   Estimated Cost: ${formatINR(cost)}`
            );

          doc.moveDown(0.6);
        }
      );
    }

    // ========================================================
    // COST FORECAST
    // ========================================================

    sectionTitle(
      doc,
      "5-Year Cost Forecast"
    );

    if (costForecast.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666666")
        .text(
          "Cost forecast data was not available."
        );
    } else {
      costForecast.forEach(
        (yearData, index) => {
          const year =
            yearData.year ||
            `Year ${index + 1}`;

          const amount =
            yearData.amount ??
            yearData.cost ??
            yearData.total ??
            0;

          keyValue(
            doc,
            year,
            formatINR(amount)
          );
        }
      );
    }

    // ========================================================
    // NEGOTIATION BRIEF
    // ========================================================

    sectionTitle(
      doc,
      "Negotiation Brief"
    );

    if (negotiation.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666666")
        .text(
          "No negotiation recommendations available."
        );
    } else {
      negotiation.forEach(
        (point, index) => {
          const description =
            typeof point === "string"
              ? point
              : point.description ||
                point.reason ||
                point.item ||
                `Negotiation point ${index + 1}`;

          const amount =
            typeof point === "object"
              ? point.amount ||
                point.credit ||
                point.value
              : null;

          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#111827")
            .text(
              `${index + 1}. ${description}`
            );

          if (amount) {
            doc
              .font("Helvetica")
              .fontSize(9)
              .fillColor("#DC2626")
              .text(
                `Potential adjustment: ${formatINR(
                  amount
                )}`
              );
          }

          doc.moveDown(0.5);
        }
      );
    }

    // ========================================================
    // VENDOR MATCHES
    // ========================================================

    sectionTitle(
      doc,
      "Vendor Matches"
    );

    if (vendors.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666666")
        .text(
          "No vendor recommendations available."
        );
    } else {
      vendors.forEach(
        (vendor, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }

          const name =
            vendor.name ||
            vendor.company ||
            `Vendor ${index + 1}`;

          const rating =
            vendor.rating ||
            vendor.stars ||
            "N/A";

          const responseTime =
            vendor.responseTime ||
            vendor.response ||
            "N/A";

          const quote =
            vendor.quote ??
            vendor.price ??
            vendor.cost ??
            0;

          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#111827")
            .text(name);

          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#555555")
            .text(
              `Rating: ${rating}   |   Response: ${responseTime}   |   Quote: ${formatINR(
                quote
              )}`
            );

          doc.moveDown(0.6);
        }
      );
    }

    // ========================================================
    // FOOTER ON ALL PAGES
    // ========================================================

    const range =
      doc.bufferedPageRange();

    for (
      let i = range.start;
      i < range.start + range.count;
      i++
    ) {
      doc.switchToPage(i);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text(
          `HomeGuardian AI • INR (₹) • Page ${
            i + 1
          } of ${range.count}`,
          50,
          780,
          {
            align: "center",
            width: 495,
          }
        );
    }

    // ========================================================
    // FINALIZE PDF
    // ========================================================

    doc.end();
  } catch (error) {
    console.error(
      "PDF generation failed:",
      error
    );

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error:
          "Failed to generate PDF report.",
        details: error.message,
      });
    }
  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  generatePropertyPDF,
  formatINR,
};
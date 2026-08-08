const PDFDocument = require("pdfkit");

function generatePropertyPDF(report, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 45,
  });

  // Tell browser this is a PDF
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="HomeGuardian-AI-Report.pdf"'
  );

  // Pipe PDF directly to browser
  doc.pipe(res);

  // =====================================================
  // TITLE
  // =====================================================

  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("HomeGuardian AI", {
      align: "center",
    });

  doc
    .moveDown(0.3)
    .fontSize(14)
    .font("Helvetica")
    .text("AI-Powered Home Intelligence Report", {
      align: "center",
    });

  doc.moveDown(1);

  // =====================================================
  // PROPERTY INFORMATION
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Property Information");

  doc.moveDown(0.4);

  doc
    .fontSize(11)
    .font("Helvetica")
    .text(
      `Address: ${
        report.property?.address || "Not provided"
      }`
    );

  doc.text(
    `Generated: ${
      report.generatedAt
        ? new Date(report.generatedAt).toLocaleString("en-IN")
        : new Date().toLocaleString("en-IN")
    }`
  );

  doc.text("Currency: INR");

  doc.moveDown(1);

  // =====================================================
  // HOME HEALTH SCORE
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Home Health Score");

  doc.moveDown(0.4);

  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(
      `${report.homeHealthScore ?? "N/A"} / 100`
    );

  doc.moveDown(1);

  // =====================================================
  // SYSTEM SCORES
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("System Health");

  doc.moveDown(0.4);

  const systemScores =
    report.systemScores || {};

  Object.entries(systemScores).forEach(
    ([system, score]) => {
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(
          `${system.toUpperCase()}: ${score}/100`
        );
    }
  );

  doc.moveDown(1);

  // =====================================================
  // VISION INSPECTION
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Vision Inspection");

  doc.moveDown(0.4);

  const defects =
    report.visionInspection?.defects || [];

  if (defects.length === 0) {
    doc
      .fontSize(11)
      .font("Helvetica")
      .text("No defects detected.");
  } else {
    defects.forEach((defect, index) => {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
          `${index + 1}. ${defect.label || "Unknown defect"}`
        );

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `System: ${defect.system || "N/A"}`
        );

      doc.text(
        `Severity: ${defect.severity || "N/A"}`
      );

      doc.moveDown(0.3);
    });
  }

  doc.moveDown(0.8);

  // =====================================================
  // STRUCTURAL RISKS
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Structural Risk");

  doc.moveDown(0.4);

  const risks =
    report.structuralRisk?.risks || [];

  if (risks.length === 0) {
    doc
      .fontSize(11)
      .font("Helvetica")
      .text("No structural risks reported.");
  } else {
    risks.forEach((risk, index) => {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
          `${index + 1}. ${risk.label || "Risk"}`
        );

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `System: ${risk.system || "N/A"}`
        );

      if (risk.probability !== undefined) {
        doc.text(
          `Probability: ${Math.round(
            risk.probability * 100
          )}%`
        );
      }

      doc.moveDown(0.3);
    });
  }

  doc.moveDown(0.8);

  // =====================================================
  // COST FORECAST
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Cost Forecast");

  doc.moveDown(0.4);

  const costItems =
    report.costForecast?.items || [];

  costItems.forEach((item, index) => {
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(
        `${index + 1}. ${item.label || "Repair"}`
      );

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Estimated Cost: ${
          item.costFormatted ||
          formatINR(item.cost)
        }`
      );

    doc.moveDown(0.2);
  });

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(
      `5-Year Estimated Cost: ${
        report.costForecast
          ?.totalFiveYearFormatted ||
        formatINR(
          report.costForecast?.totalFiveYear
        )
      }`
    );

  doc.moveDown(1);

  // =====================================================
  // MAINTENANCE PLAN
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Maintenance Plan");

  doc.moveDown(0.4);

  const maintenance =
    report.maintenancePlan || [];

  maintenance.forEach((item) => {
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(
        `${item.month || "Timeline"}`
      );

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Task: ${item.task || "N/A"}`
      );

    doc.text(
      `Estimated Cost: ${
        item.estCost
          ? formatINR(item.estCost)
          : "N/A"
      }`
    );

    doc.moveDown(0.3);
  });

  doc.moveDown(0.8);

  // =====================================================
  // NEGOTIATION
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Negotiation Intelligence");

  doc.moveDown(0.4);

  const negotiation =
    report.negotiationBrief;

  if (negotiation) {
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Potential Negotiation Leverage: ${
          negotiation.totalLeverageFormatted ||
          formatINR(
            negotiation.totalLeverage
          )
        }`
      );

    doc.moveDown(0.4);

    const leverage =
      negotiation.leveragePoints || [];

    leverage.forEach((item) => {
      doc
        .fontSize(10)
        .text(
          `• ${item.point}: ${
            item.suggestedCreditFormatted ||
            formatINR(item.suggestedCredit)
          }`
        );
    });
  }

  doc.moveDown(1);

  // =====================================================
  // VENDORS
  // =====================================================

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Vendor Matches");

  doc.moveDown(0.4);

  const vendors =
    report.vendorMatches || [];

  vendors.forEach((vendor) => {
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(vendor.name || "Vendor");

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Specialty: ${
          vendor.specialty || "N/A"
        }`
      );

    doc.text(
      `Rating: ${
        vendor.rating || "N/A"
      }`
    );

    doc.text(
      `Estimated Quote: ${
        vendor.quoteFormatted ||
        formatINR(vendor.quote)
      }`
    );

    doc.moveDown(0.3);
  });

  // =====================================================
  // REPAIR PRIORITY
  // =====================================================

  doc.addPage();

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("Repair Priority");

  doc.moveDown(0.5);

  const priorities =
    report.repairPriority || [];

  priorities.forEach((item, index) => {
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(
        `${index + 1}. ${
          item.label || "Repair"
        }`
      );

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Priority: ${
          item.priority || "N/A"
        }`
      );

    doc.text(
      `Cost: ${
        item.costFormatted ||
        formatINR(item.cost)
      }`
    );

    doc.moveDown(0.3);
  });

  // =====================================================
  // DISCLAIMER
  // =====================================================

  doc.moveDown(1);

  doc
    .fontSize(9)
    .font("Helvetica")
    .text(
      "Disclaimer: HomeGuardian AI provides AI-assisted property insights and cost estimates for informational purposes. Structural, electrical, plumbing, and other safety-critical findings should be verified by qualified professionals."
    );

  // =====================================================
  // FOOTER
  // =====================================================

  doc
    .fontSize(9)
    .text(
      "Generated by HomeGuardian AI",
      45,
      780,
      {
        align: "center",
        width: 500,
      }
    );

  // Finish PDF
  doc.end();
}


// =====================================================
// INR FORMATTER
// =====================================================

function formatINR(amount) {
  if (
    amount === undefined ||
    amount === null ||
    isNaN(amount)
  ) {
    return "₹0";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}


module.exports = {
  generatePropertyPDF,
};
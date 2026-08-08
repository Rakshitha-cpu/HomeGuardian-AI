/**
 * HomeGuardian AI — Agent layer
 *
 * Each function below represents one of the 8 specialized agents described
 * in the PRD. Most remain deterministic rule-based logic so the API is
 * fully runnable without any external AI provider. The Vision Inspection
 * agent, however, calls Google Gemini's vision model on real uploaded
 * photos when GEMINI_API_KEY is set in .env — falling back to mock output
 * automatically if no key is configured or no photos were uploaded.
 *
 * To go from mock -> real for the remaining agents:
 *   - structuralRiskAgent: replace heuristics with a trained risk model or
 *     an LLM reasoning step conditioned on inspection findings.
 *   - costIntelligenceAgent: connect to a real regional cost-estimation API
 *     or dataset (e.g. RSMeans-style data) instead of the static table.
 *   - vendorIntelligenceAgent: connect to a vendor/contractor directory API.
 *   - all others: replace the mock logic with calls to an LLM/agent runtime,
 *     keeping the same input/output shape so routes.js doesn't need to change.
 */

const fs = require("fs");
const path = require("path");

const SYSTEMS = ["roof", "structure", "plumbing", "electrical", "hvac", "exterior"];

// USD-authored mock cost data is converted to INR at this fixed rate so the
// whole app (API responses + dashboard) speaks one currency end-to-end.
const USD_TO_INR = 83;
function toINR(usd) {
  return Math.round(usd * USD_TO_INR);
}
function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function scoreSystem(seed, base) {
  const noise = Math.floor(seededRandom(seed) * 20) - 10;
  return Math.max(35, Math.min(98, base + noise));
}

// 1. Vision Inspection Agent
const MOCK_DEFECTS = [
  { system: "roof", label: "Minor shingle wear, south-facing slope", severity: "moderate" },
  { system: "exterior", label: "Gutter seams show early rust staining", severity: "moderate" },
  { system: "electrical", label: "Older panel labeling, appears original to build year", severity: "low" },
];

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

/**
 * Calls Google Gemini's vision model on real uploaded photos and returns
 * a defect list in the same shape the rest of the app expects. Requires
 * GEMINI_API_KEY in .env. Any failure (missing key, network error, bad
 * JSON from the model) falls back to the mock defect list so the report
 * never breaks the demo.
 */
async function analyzeImagesWithGemini(imageFilePaths) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !imageFilePaths || imageFilePaths.length === 0) return null;

  try {
    const imageParts = imageFilePaths.slice(0, 6).map((filePath) => ({
      inline_data: {
        mime_type: mimeTypeFor(filePath),
        data: fs.readFileSync(filePath).toString("base64"),
      },
    }));

    const prompt =
      "You are a home inspection vision agent. Look at these real property photos and list " +
      "visible defects or points of interest. For each, give: system (one of roof, structure, " +
      "plumbing, electrical, hvac, exterior), a short label describing what you see, and " +
      "severity (low, moderate, or high). Only report what you can actually see in the photos — " +
      "do not invent defects that aren't visible. If the photos show no visible issues, return an " +
      "empty defects array. Respond with ONLY raw JSON in this exact shape, no markdown fences, " +
      'no extra text: {"defects":[{"system":"roof","label":"...","severity":"moderate"}]}';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, ...imageParts] }],
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.defects)) return null;
    return parsed.defects;
  } catch (err) {
    console.error("Gemini vision analysis failed, falling back to mock:", err.message);
    return null;
  }
}

async function visionInspectionAgent(propertySeed, uploadedFileCount, imageFilePaths) {
  const realDefects = await analyzeImagesWithGemini(imageFilePaths);
  const usedRealAI = realDefects !== null;
  return {
    agent: "Vision Inspection Agent",
    filesAnalyzed: uploadedFileCount || 0,
    source: usedRealAI ? "gemini-vision" : "mock",
    defects: usedRealAI ? realDefects : MOCK_DEFECTS,
  };
}

// 2. Structural Risk Agent
function structuralRiskAgent(propertySeed, visionOutput) {
  const risks = [
    { system: "structure", label: "Hairline foundation crack — monitor for movement", probability: 0.42 },
    { system: "plumbing", label: "Water heater approaching 70% of expected service life", probability: 0.58 },
  ];
  return {
    agent: "Structural Risk Agent",
    risks,
  };
}

// 3. Property Health Agent
function propertyHealthAgent(propertySeed) {
  const systemScores = {};
  SYSTEMS.forEach((sys, i) => {
    const base = { roof: 80, structure: 68, plumbing: 88, electrical: 74, hvac: 82, exterior: 70 }[sys];
    systemScores[sys] = scoreSystem(propertySeed + i, base);
  });
  const overall = Math.round(
    Object.values(systemScores).reduce((a, b) => a + b, 0) / SYSTEMS.length
  );
  return {
    agent: "Property Health Agent",
    overallScore: overall,
    systemScores,
  };
}

// 4. Cost Intelligence Agent
function costIntelligenceAgent(risks, defects) {
  const costTable = {
    "Foundation hairline crack — monitor & seal": 2800,
    "Panel upgrade — 100A to 200A service": 3400,
    "Gutter resealing before wet season": 650,
    "Water heater — replace within 18 months": 1900,
    "Roof shingles — reseal south-facing slope": 2200,
    "Repaint exterior trim": 1600,
  };
  const items = Object.entries(costTable).map(([label, usd]) => {
    const cost = toINR(usd);
    return { label, cost, costFormatted: formatINR(cost) };
  });
  const fiveYearForecast = [7200, 2100, 3400, 1800, 3700].map(toINR);
  const totalFiveYear = fiveYearForecast.reduce((a, b) => a + b, 0);
  return {
    agent: "Cost Intelligence Agent",
    currency: "INR",
    items,
    fiveYearForecast,
    fiveYearForecastFormatted: fiveYearForecast.map(formatINR),
    totalFiveYear,
    totalFiveYearFormatted: formatINR(totalFiveYear),
  };
}

// 5. Maintenance Planner Agent
function maintenancePlannerAgent(costItems) {
  const months = ["Month 1", "Month 2", "Month 3", "Month 6", "Month 9", "Month 12"];
  const plan = costItems.items.slice(0, 6).map((item, i) => ({
    month: months[i % months.length],
    task: item.label,
    estCost: item.cost,
  }));
  return { agent: "Maintenance Planner Agent", plan };
}

// 6. Negotiation Advisor Agent
function negotiationAdvisorAgent(costItems) {
  const leveragePoints = costItems.items
    .filter((i) => i.cost >= toINR(1200))
    .map((i) => ({ point: i.label, suggestedCredit: i.cost, suggestedCreditFormatted: i.costFormatted }));
  const totalLeverage = leveragePoints.reduce((a, b) => a + b.suggestedCredit, 0);
  return {
    agent: "Negotiation Advisor Agent",
    leveragePoints,
    totalLeverage,
    totalLeverageFormatted: formatINR(totalLeverage),
  };
}

// 7. Vendor Intelligence Agent
function vendorIntelligenceAgent() {
  const raw = [
    { name: "Bengaluru Structural Co.", rating: 4.9, responseTime: "4h", quote: 2650, specialty: "Structure" },
    { name: "Vidyut Electric Works", rating: 4.8, responseTime: "6h", quote: 3150, specialty: "Electrical" },
    { name: "Namma Roof & Gutter", rating: 4.7, responseTime: "12h", quote: 580, specialty: "Roof / exterior" },
  ];
  return {
    agent: "Vendor Intelligence Agent",
    currency: "INR",
    vendors: raw.map((v) => ({ ...v, quote: toINR(v.quote), quoteFormatted: formatINR(toINR(v.quote)) })),
  };
}

// 8. Budget Optimization Agent
function budgetOptimizationAgent(costItems, budgetCap) {
  const sorted = [...costItems.items].sort((a, b) => b.cost - a.cost);
  let running = 0;
  const prioritized = sorted.map((item) => {
    running += item.cost;
    const priority = item.cost >= toINR(2500) ? "urgent" : item.cost >= toINR(1500) ? "soon" : "plan_ahead";
    return { ...item, priority, runningTotalFormatted: formatINR(running), withinBudget: budgetCap ? running <= budgetCap : true };
  });
  return {
    agent: "Budget Optimization Agent",
    currency: "INR",
    prioritized,
    budgetCap: budgetCap || null,
    budgetCapFormatted: budgetCap ? formatINR(budgetCap) : null,
  };
}

/**
 * Orchestrator — runs all 8 agents in the correct dependency order and
 * assembles the unified Home Intelligence Report.
 */
async function runOrchestration({ address, uploadedFileCount, budgetCap, imageFilePaths }) {
  const seed = hashString(address || "default-property");

  const vision = await visionInspectionAgent(seed, uploadedFileCount, imageFilePaths);
  const risk = structuralRiskAgent(seed, vision);
  const health = propertyHealthAgent(seed);
  const cost = costIntelligenceAgent(risk.risks, vision.defects);
  const maintenance = maintenancePlannerAgent(cost);
  const negotiation = negotiationAdvisorAgent(cost);
  const vendors = vendorIntelligenceAgent();
  const budget = budgetOptimizationAgent(cost, budgetCap);

  return {
    property: { address: address || "Unknown address" },
    generatedAt: new Date().toISOString(),
    currency: "INR",
    homeHealthScore: health.overallScore,
    systemScores: health.systemScores,
    visionInspection: vision,
    structuralRisk: risk,
    costForecast: cost,
    maintenancePlan: maintenance.plan,
    negotiationBrief: negotiation,
    vendorMatches: vendors.vendors,
    repairPriority: budget.prioritized,
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 1000;
}

module.exports = {
  visionInspectionAgent,
  structuralRiskAgent,
  propertyHealthAgent,
  costIntelligenceAgent,
  maintenancePlannerAgent,
  negotiationAdvisorAgent,
  vendorIntelligenceAgent,
  budgetOptimizationAgent,
  runOrchestration,
  toINR,
  formatINR,
};

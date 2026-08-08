// =====================================================
// HOMEGUARDIAN AI - FRONTEND FUNCTIONS
// =====================================================

const API_BASE = "/api";

// =====================================================
// UPLOAD FUNCTION
// =====================================================
async function upload() {
  console.log("🔵 Upload function called");
  
  const fileInput = document.querySelector("input[type='file']");
  if (!fileInput || !fileInput.files.length) {
    alert("Please select a file first");
    return;
  }

  const file = fileInput.files[0];
  console.log("📁 File selected:", file.name);

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file: file.name,
        size: file.size
      })
    });

    const data = await response.json();
    console.log("✅ Upload successful:", data);
    alert("✅ File uploaded: " + file.name);
    document.getElementById("upload-status").innerHTML = "<span style='color: green;'>✅ Upload successful!</span>";
    return data;
  } catch (error) {
    console.error("❌ Upload error:", error);
    alert("❌ Upload failed: " + error.message);
    document.getElementById("upload-status").innerHTML = "<span style='color: red;'>❌ Upload failed!</span>";
  }
}

// =====================================================
// ANALYZE FUNCTION
// =====================================================
async function analyze() {
  console.log("🔵 Analyze function called");

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        analysisType: "home_inspection"
      })
    });

    const data = await response.json();
    console.log("✅ Analysis successful:", data);
    
    if (data.success) {
      alert("✅ Analysis Complete!\n\nHome Score: " + data.homeScore);
      document.getElementById("analyze-status").innerHTML = "<span style='color: green;'>✅ Analysis complete! Home Score: " + data.homeScore + "</span>";
    }
    
    return data;
  } catch (error) {
    console.error("❌ Analysis error:", error);
    alert("❌ Analysis failed: " + error.message);
    document.getElementById("analyze-status").innerHTML = "<span style='color: red;'>❌ Analysis failed!</span>";
  }
}

// =====================================================
// LOGIN FUNCTION
// =====================================================
async function login() {
  console.log("🔵 Login function called");

  const emailInput = document.querySelector("input[type='email']");
  const passwordInput = document.querySelector("input[type='password']");

  if (!emailInput || !passwordInput) {
    alert("Email or password input not found");
    return;
  }

  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();
    console.log("✅ Login successful:", data);
    
    if (data.success) {
      alert("✅ Login successful!\nWelcome!");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      document.getElementById("login-status").innerHTML = "<span style='color: green;'>✅ Login successful!</span>";
    }
    
    return data;
  } catch (error) {
    console.error("❌ Login error:", error);
    alert("❌ Login failed: " + error.message);
    document.getElementById("login-status").innerHTML = "<span style='color: red;'>❌ Login failed!</span>";
  }
}

// =====================================================
// REGISTER FUNCTION
// =====================================================
async function register() {
  console.log("🔵 Register function called");

  const emailInput = document.querySelector("input[type='email']");
  const passwordInput = document.querySelector("input[type='password']");

  if (!emailInput || !passwordInput) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value
      })
    });

    const data = await response.json();
    console.log("✅ Registration successful:", data);
    alert("✅ Account created successfully!");
    document.getElementById("login-status").innerHTML = "<span style='color: green;'>✅ Registration successful!</span>";
    
    return data;
  } catch (error) {
    console.error("❌ Registration error:", error);
    alert("❌ Registration failed: " + error.message);
    document.getElementById("login-status").innerHTML = "<span style='color: red;'>❌ Registration failed!</span>";
  }
}

// =====================================================
// TEST BACKEND CONNECTION
// =====================================================
async function testBackend() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log("✅ Backend connection successful:", data);
    return true;
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    return false;
  }
}

// =====================================================
// INITIALIZE ON PAGE LOAD
// =====================================================
document.addEventListener("DOMContentLoaded", function() {
  console.log("🟢 Page loaded - HomeGuardian AI Frontend");
  testBackend();
});

console.log("✅ auth.js loaded successfully");

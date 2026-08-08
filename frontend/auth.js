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
    
    return data;
  } catch (error) {
    console.error("❌ Upload error:", error);
    alert("❌ Upload failed: " + error.message);
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
      
      // Optionally redirect to dashboard
      // window.location.href = "/dashboard.html";
    }
    
    return data;
  } catch (error) {
    console.error("❌ Analysis error:", error);
    alert("❌ Analysis failed: " + error.message);
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
    console.error("Email or password input not found");
    alert("Login form not found");
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
      alert("✅ Login successful!\nWelcome, " + data.user.name);
      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect to dashboard
      // window.location.href = "/dashboard.html";
    }
    
    return data;
  } catch (error) {
    console.error("❌ Login error:", error);
    alert("❌ Login failed: " + error.message);
  }
}

// =====================================================
// REGISTER FUNCTION
// =====================================================
async function register() {
  console.log("🔵 Register function called");

  const nameInput = document.querySelector("input[placeholder*='Name']") || document.querySelector("input[name='name']");
  const emailInput = document.querySelector("input[type='email']");
  const passwordInput = document.querySelector("input[type='password']");

  if (!nameInput || !emailInput || !passwordInput) {
    alert("Please fill in all registration fields");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value
      })
    });

    const data = await response.json();
    console.log("✅ Registration successful:", data);
    alert("✅ Account created successfully!");
    
    return data;
  } catch (error) {
    console.error("❌ Registration error:", error);
    alert("❌ Registration failed: " + error.message);
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
  
  // Test backend connection
  testBackend();

  // Attach click handlers to all buttons
  const buttons = document.querySelectorAll("button");
  console.log("Found " + buttons.length + " buttons");
  
  buttons.forEach(btn => {
    btn.addEventListener("click", function(e) {
      const btnText = btn.textContent.toLowerCase();
      console.log("🔘 Button clicked:", btn.textContent);

      // Match button text to function
      if (btnText.includes("upload")) {
        upload();
      } else if (btnText.includes("analyze")) {
        analyze();
      } else if (btnText.includes("login")) {
        login();
      } else if (btnText.includes("register")) {
        register();
      }
    });
  });
});

// Export for use
console.log("✅ auth.js loaded successfully");
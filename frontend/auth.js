/* =========================================================
   HomeGuardian AI
   Authentication Frontend
   Works locally + on Render
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       API CONFIGURATION
       ===================================================== */

    const API_BASE =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "http://localhost:4000"
            : window.location.origin;


    /* =====================================================
       HELPERS
       ===================================================== */

    function getElement(...ids) {
        for (const id of ids) {
            const element = document.getElementById(id);

            if (element) {
                return element;
            }
        }

        return null;
    }


    function showMessage(message, type = "error") {
        let box = getElement(
            "msg",
            "message",
            "error",
            "success",
            "statusMessage",
            "authMessage"
        );

        if (!box) {
            box = document.createElement("div");
            box.id = "authMessage";

            const form =
                document.querySelector("form") ||
                document.body;

            form.appendChild(box);
        }

        box.textContent = message;

        box.style.display = "block";
        box.style.marginTop = "14px";
        box.style.fontSize = "13px";

        if (type === "success") {
            box.style.color = "#34D399";
        } else {
            box.style.color = "#FCA5A5";
        }
    }


    function clearMessage() {
        const box = getElement(
            "msg",
            "message",
            "error",
            "success",
            "statusMessage",
            "authMessage"
        );

        if (box) {
            box.textContent = "";
            box.style.display = "none";
        }
    }


    function setButtonLoading(button, loading, normalText) {
        if (!button) {
            return;
        }

        button.disabled = loading;

        if (loading) {
            button.dataset.originalText =
                button.textContent;

            button.textContent = "Please wait...";
            button.style.opacity = "0.7";
        } else {
            button.textContent =
                button.dataset.originalText ||
                normalText ||
                "Submit";

            button.style.opacity = "1";
        }
    }


    /* =====================================================
       API REQUEST
       ===================================================== */

    async function apiRequest(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;

        console.log("HomeGuardian API:", url);

        const response = await fetch(url, {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {
                success: false,
                error: "Server returned an invalid response."
            };
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                `Request failed (${response.status})`
            );
        }

        return data;
    }


    /* =====================================================
       REGISTER
       ===================================================== */

    async function registerUser(event) {
        if (event) {
            event.preventDefault();
        }

        const nameInput = getElement(
            "name",
            "fullName",
            "registerName"
        );

        const emailInput = getElement(
            "email",
            "registerEmail"
        );

        const passwordInput = getElement(
            "password",
            "registerPassword"
        );

        const button = getElement(
            "registerBtn",
            "registerButton",
            "submitBtn"
        );

        const name =
            nameInput?.value.trim() || "";

        const email =
            emailInput?.value.trim() || "";

        const password =
            passwordInput?.value || "";

        clearMessage();


        /* -----------------------------
           VALIDATION
           ----------------------------- */

        if (!name) {
            showMessage("Please enter your name.");
            nameInput?.focus();
            return;
        }

        if (!email) {
            showMessage("Please enter your email address.");
            emailInput?.focus();
            return;
        }

        if (!email.includes("@")) {
            showMessage("Please enter a valid email address.");
            emailInput?.focus();
            return;
        }

        if (!password) {
            showMessage("Please enter a password.");
            passwordInput?.focus();
            return;
        }

        if (password.length < 6) {
            showMessage(
                "Password must contain at least 6 characters."
            );
            passwordInput?.focus();
            return;
        }


        setButtonLoading(
            button,
            true,
            "Create account →"
        );


        try {
            const data = await apiRequest(
                "/api/auth/register",
                {
                    method: "POST",

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );


            console.log(
                "Register response:",
                data
            );


            /*
             * Some backends return a token immediately
             * after registration. Save it if available.
             */

            if (data.token) {
                localStorage.setItem(
                    "homeguardian_token",
                    data.token
                );
            }

            if (data.user) {
                localStorage.setItem(
                    "homeguardian_user",
                    JSON.stringify(data.user)
                );
            }


            showMessage(
                data.message ||
                "Account created successfully.",
                "success"
            );


            /*
             * If a token was returned, go directly
             * to dashboard. Otherwise send the user
             * to login.
             */

            setTimeout(() => {
                if (data.token) {
                    window.location.href = "/dashboard";
                } else {
                    window.location.href = "/login";
                }
            }, 1000);


        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            showMessage(
                error.message ||
                "Registration failed. Please try again."
            );

        } finally {
            setButtonLoading(
                button,
                false,
                "Create account →"
            );
        }
    }


    /* =====================================================
       LOGIN
       ===================================================== */

    async function loginUser(event) {
        if (event) {
            event.preventDefault();
        }

        const emailInput = getElement(
            "email",
            "loginEmail"
        );

        const passwordInput = getElement(
            "password",
            "loginPassword"
        );

        const button = getElement(
            "loginBtn",
            "loginButton",
            "submitBtn"
        );

        const email =
            emailInput?.value.trim() || "";

        const password =
            passwordInput?.value || "";

        clearMessage();


        /* -----------------------------
           VALIDATION
           ----------------------------- */

        if (!email) {
            showMessage(
                "Please enter your email address."
            );

            emailInput?.focus();
            return;
        }

        if (!password) {
            showMessage(
                "Please enter your password."
            );

            passwordInput?.focus();
            return;
        }


        setButtonLoading(
            button,
            true,
            "Log in →"
        );


        try {
            const data = await apiRequest(
                "/api/auth/login",
                {
                    method: "POST",

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );


            console.log(
                "Login response:",
                data
            );


            /* -----------------------------
               SAVE SESSION
               ----------------------------- */

            if (data.token) {
                localStorage.setItem(
                    "homeguardian_token",
                    data.token
                );
            }

            if (data.user) {
                localStorage.setItem(
                    "homeguardian_user",
                    JSON.stringify(data.user)
                );
            }


            showMessage(
                data.message ||
                "Login successful.",
                "success"
            );


            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 700);


        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            showMessage(
                error.message ||
                "Login failed. Please check your credentials."
            );

        } finally {
            setButtonLoading(
                button,
                false,
                "Log in →"
            );
        }
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    function logoutUser() {
        localStorage.removeItem(
            "homeguardian_token"
        );

        localStorage.removeItem(
            "homeguardian_user"
        );

        window.location.href = "/";
    }


    /* =====================================================
       AUTH STATE
       ===================================================== */

    function isLoggedIn() {
        return Boolean(
            localStorage.getItem(
                "homeguardian_token"
            )
        );
    }


    function getCurrentUser() {
        const value =
            localStorage.getItem(
                "homeguardian_user"
            );

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }


    /* =====================================================
       INITIALIZE REGISTER FORM
       ===================================================== */

    function initializeRegister() {
        const form =
            document.querySelector("#registerForm");

        if (form) {
            form.addEventListener(
                "submit",
                registerUser
            );
        }
    }


    /* =====================================================
       INITIALIZE LOGIN FORM
       ===================================================== */

    function initializeLogin() {
        const form =
            document.querySelector("#loginForm");

        if (form) {
            form.addEventListener(
                "submit",
                loginUser
            );
        }
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.HomeGuardianAuth = {

        register: registerUser,

        login: loginUser,

        logout: logoutUser,

        isLoggedIn: isLoggedIn,

        getCurrentUser: getCurrentUser,

        apiRequest: apiRequest,

        API_BASE: API_BASE
    };


    /*
     * Backward compatibility.
     */

    window.registerUser = registerUser;

    window.loginUser = loginUser;

    window.logoutUser = logoutUser;


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            initializeRegister();

            initializeLogin();

            console.log(
                "===================================="
            );

            console.log(
                "HomeGuardian AI Authentication"
            );

            console.log(
                "API:",
                API_BASE
            );

            console.log(
                "===================================="
            );
        }
    );

})();
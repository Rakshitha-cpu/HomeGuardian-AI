/* =========================================================
   HomeGuardian AI
   Authentication Frontend
   Works with Localhost + Render + Vercel
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       API CONFIGURATION
       ===================================================== */

    /*
     * IMPORTANT:
     *
     * Local development:
     *     http://localhost:4000
     *
     * Production:
     *     Put your Render backend URL below.
     *
     * Example:
     *     https://homeguardian-ai.onrender.com
     *
     * DO NOT put /api at the end.
     */

    const RENDER_API_URL =
        "https://YOUR-RENDER-SERVICE.onrender.com";


    const API_BASE =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "http://localhost:4000"
            : RENDER_API_URL;


    /* =====================================================
       HELPERS
       ===================================================== */

    function getElement(...ids) {

        for (const id of ids) {

            const element =
                document.getElementById(id);

            if (element) {
                return element;
            }
        }

        return null;
    }


    function showMessage(
        message,
        type = "error"
    ) {

        let box =
            getElement(
                "authMessage",
                "msg",
                "message",
                "error",
                "success",
                "statusMessage"
            );


        if (!box) {

            box =
                document.createElement("div");

            box.id = "authMessage";

            const form =
                document.querySelector("form") ||
                document.body;

            form.prepend(box);
        }


        box.textContent = message;

        box.className =
            type === "success"
                ? "success"
                : "error";

        box.style.display = "block";
    }


    function clearMessage() {

        const box =
            getElement(
                "authMessage",
                "msg",
                "message",
                "error",
                "success",
                "statusMessage"
            );


        if (box) {

            box.textContent = "";

            box.className = "";

            box.style.display = "none";
        }
    }


    function setButtonLoading(
        button,
        loading,
        normalText
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            if (!button.dataset.originalText) {

                button.dataset.originalText =
                    button.textContent;
            }


            button.disabled = true;

            button.textContent =
                "Please wait...";

            button.style.opacity = "0.65";

        } else {

            button.disabled = false;

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

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const url =
            `${API_BASE}${endpoint}`;


        console.log(
            "HomeGuardian API:",
            url
        );


        const token =
            localStorage.getItem(
                "homeguardian_token"
            );


        const headers = {

            "Content-Type":
                "application/json",

            ...(options.headers || {})
        };


        /*
         * Send authentication token when available.
         */

        if (token) {

            headers.Authorization =
                `Bearer ${token}`;
        }


        let response;


        try {

            response =
                await fetch(
                    url,
                    {
                        ...options,
                        headers
                    }
                );

        } catch (error) {

            console.error(
                "Network error:",
                error
            );

            throw new Error(
                "Unable to connect to HomeGuardian AI server. Please make sure the Render backend is running."
            );
        }


        let data = {};


        try {

            data =
                await response.json();

        } catch (error) {

            data = {
                success: false,
                error:
                    "Server returned an invalid response."
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


        const nameInput =
            getElement(
                "name",
                "fullName",
                "registerName"
            );


        const emailInput =
            getElement(
                "email",
                "registerEmail"
            );


        const passwordInput =
            getElement(
                "password",
                "registerPassword"
            );


        const button =
            getElement(
                "registerBtn",
                "registerButton",
                "submitBtn"
            );


        const name =
            nameInput?.value.trim() || "";


        const email =
            emailInput?.value.trim().toLowerCase() || "";


        const password =
            passwordInput?.value || "";


        clearMessage();


        /* =================================================
           VALIDATION
           ================================================= */


        if (!name) {

            showMessage(
                "Please enter your name."
            );

            nameInput?.focus();

            return;
        }


        if (!email) {

            showMessage(
                "Please enter your email address."
            );

            emailInput?.focus();

            return;
        }


        /*
         * Basic email validation.
         */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            showMessage(
                "Please enter a valid email address."
            );

            emailInput?.focus();

            return;
        }


        if (!password) {

            showMessage(
                "Please enter a password."
            );

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

            /* =============================================
               REGISTER API
               ============================================= */

            const data =
                await apiRequest(
                    "/api/auth/register",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
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


            /* =============================================
               SAVE TOKEN
               ============================================= */

            if (data.token) {

                localStorage.setItem(
                    "homeguardian_token",
                    data.token
                );
            }


            /* =============================================
               SAVE USER
               ============================================= */

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


            /* =============================================
               REDIRECT
               ============================================= */

            setTimeout(
                function () {

                    if (data.token) {

                        window.location.href =
                            "/dashboard";

                    } else {

                        window.location.href =
                            "/login";
                    }

                },
                900
            );


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


        const emailInput =
            getElement(
                "email",
                "loginEmail"
            );


        const passwordInput =
            getElement(
                "password",
                "loginPassword"
            );


        const button =
            getElement(
                "loginBtn",
                "loginButton",
                "submitBtn"
            );


        const email =
            emailInput?.value.trim().toLowerCase() || "";


        const password =
            passwordInput?.value || "";


        clearMessage();


        /* =================================================
           VALIDATION
           ================================================= */


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

            /* =============================================
               LOGIN API
               ============================================= */

            const data =
                await apiRequest(
                    "/api/auth/login",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );


            console.log(
                "Login response:",
                data
            );


            /* =============================================
               SAVE TOKEN
               ============================================= */

            if (data.token) {

                localStorage.setItem(
                    "homeguardian_token",
                    data.token
                );
            }


            /* =============================================
               SAVE USER
               ============================================= */

            if (data.user) {

                localStorage.setItem(
                    "homeguardian_user",
                    JSON.stringify(data.user)
                );
            }


            /*
             * If backend didn't return a token,
             * don't pretend authentication worked.
             */

            if (!data.token) {

                showMessage(
                    "Login response did not contain an authentication token."
                );

                return;
            }


            showMessage(
                data.message ||
                "Login successful.",
                "success"
            );


            /* =============================================
               REDIRECT TO DASHBOARD
               ============================================= */

            setTimeout(
                function () {

                    window.location.href =
                        "/dashboard";

                },
                700
            );


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


        window.location.href =
            "/";
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


    /* =====================================================
       CURRENT USER
       ===================================================== */

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
       REQUIRE LOGIN
       ===================================================== */

    function requireLogin() {

        if (!isLoggedIn()) {

            window.location.href =
                "/login";

            return false;
        }

        return true;
    }


    /* =====================================================
       INITIALIZE REGISTER
       ===================================================== */

    function initializeRegister() {

        const form =
            document.querySelector(
                "#registerForm"
            );


        if (!form) {
            return;
        }


        /*
         * Prevent duplicate event listeners.
         */

        if (
            form.dataset.authInitialized ===
            "true"
        ) {
            return;
        }


        form.dataset.authInitialized =
            "true";


        form.addEventListener(
            "submit",
            registerUser
        );
    }


    /* =====================================================
       INITIALIZE LOGIN
       ===================================================== */

    function initializeLogin() {

        const form =
            document.querySelector(
                "#loginForm"
            );


        if (!form) {
            return;
        }


        if (
            form.dataset.authInitialized ===
            "true"
        ) {
            return;
        }


        form.dataset.authInitialized =
            "true";


        form.addEventListener(
            "submit",
            loginUser
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.HomeGuardianAuth = {

        register:
            registerUser,

        login:
            loginUser,

        logout:
            logoutUser,

        isLoggedIn:
            isLoggedIn,

        requireLogin:
            requireLogin,

        getCurrentUser:
            getCurrentUser,

        apiRequest:
            apiRequest,

        API_BASE:
            API_BASE
    };


    /* =====================================================
       BACKWARD COMPATIBILITY
       ===================================================== */

    window.registerUser =
        registerUser;

    window.loginUser =
        loginUser;

    window.logoutUser =
        logoutUser;


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
                "Logged in:",
                isLoggedIn()
            );

            console.log(
                "===================================="
            );
        }
    );

})();
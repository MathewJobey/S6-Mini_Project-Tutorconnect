const initLogin = () => {
    // Check if already logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const email = localStorage.getItem("userEmail");

    if (isLoggedIn && email) {
        window.location.href = "/student_dashboard/index.html";
        return;
    }

    const loginForm = document.querySelector("#loginForm");

    if (!loginForm) {
        console.error("Login form not found");
        return;
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const loginBtn = document.getElementById("loginBtn");

        // Disable the button to prevent multiple submissions
        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";

        try {
            const response = await fetch("http://localhost:5000/api/student/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Login failed");
            }

            console.log("Login successful for:", email);
            console.log("Profile setup status:", data.profileComplete ? "Completed" : "Not Completed");

            // Save user session data in localStorage
            localStorage.setItem("userEmail", email);
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userName", data.name);
            localStorage.setItem("authToken", data.token);

            // Redirect based on profile status
            if (data.profileComplete) { // Changed to profileComplete
                window.location.href = "/student_dashboard/index.html";
            } else {
                window.location.href = "/student_profile_setup.html";
            }

        } catch (error) {
            console.error("Login error:", error);
            alert(error.message || "Server error during login");
        } finally {
            // Re-enable the button
            loginBtn.disabled = false;
            loginBtn.textContent = "Login";
        }
    });

    // Handle forgot password
    const forgotPassLink = document.querySelector(".forgot-pass a");
    if (forgotPassLink) {
        forgotPassLink.addEventListener("click", function (e) {
            e.preventDefault();
            alert("Please contact administrator to reset password");
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initLogin);

export { initLogin };
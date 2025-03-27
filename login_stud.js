const initLogin = () => {
    console.log("initLogin called");
  
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const email = localStorage.getItem("userEmail");
  
    if (isLoggedIn && email) {
      console.log("Already logged in, redirecting to dashboard");
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
      console.log("Login form submitted");
  
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      const loginBtn = document.getElementById("loginBtn");
  
      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";
  
      try {
        console.log("Sending login request to server");
        const response = await fetch("http://localhost:5000/api/student/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
  
        if (!response.ok) {
          console.error("Fetch failed with status:", response.status);
          const errorText = await response.text();
          console.error("Fetch error response:", errorText);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Server response:", data);
  
        if (!data.success) {
          throw new Error(data.error || "Login failed");
        }
  
        console.log("Login successful for:", email);
        console.log("Profile setup status:", data.profileComplete ? "Completed" : "Not Completed");
  
        // Set localStorage values
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userType", "student"); // Add this line
  
        if (data.profileComplete) {
          console.log("Redirecting to dashboard");
          window.location.href = "/student_dashboard/index.html";
        } else {
          console.log("Redirecting to profile setup");
          window.location.href = "/student_profile_setup.html";
        }
  
      } catch (error) {
        console.error("Login error:", error.message);
        alert(error.message || "Server error during login");
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      }
    });
  
    const forgotPassLink = document.querySelector(".forgot-pass a");
    if (forgotPassLink) {
      forgotPassLink.addEventListener("click", (e) => {
        e.preventDefault();
        alert("Please contact administrator to reset password");
      });
    }
  };
  
  document.addEventListener("DOMContentLoaded", initLogin);
  
  export { initLogin };
// Authentication Check Function
async function checkAuth() {
    console.log("checkAuth called"); // Debug
  
    const email = localStorage.getItem("userEmail");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userType = localStorage.getItem("userType");
  
    if (!email || !isLoggedIn || userType !== "student") {
      console.log("Auth failed: Missing email, isLoggedIn, or userType");
      localStorage.clear();
      window.location.href = "/student_dashboard/auth_stud.html";
      return false;
    }
  
    // Check if the student's profile exists
    try {
      console.log("Checking profile for:", email);
      const response = await fetch("http://localhost:5000/api/student/check-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
      console.log("Profile check response:", data);
  
      if (!data.success || !data.exists) {
        console.log("Profile not found, redirecting to setup");
        window.location.href = "/student_profile_setup.html";
        return false;
      }
  
      console.log("Auth successful, staying on dashboard");
      return true;
    } catch (error) {
      console.error("Error checking profile:", error);
      localStorage.clear();
      window.location.href = "/student_dashboard/auth_stud.html";
      return false;
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
  });
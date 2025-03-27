// courses.js
async function loadCourses() {
    try {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        console.error("No user email found in localStorage");
        window.location.href = "/student_dashboard/auth_stud.html";
        return;
      }
  
      // Fetch the student's profile to get their subjects (courses)
      const response = await fetch(`http://localhost:5000/api/student/profile/${email}`, {
        headers: {
          "Authorization": email,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = "/student_dashboard/auth_stud.html";
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
  
      const profile = await response.json();
      if (!profile) {
        throw new Error("No profile data returned");
      }
  
      // Display the courses (subjects)
      displayCourses(profile.subjects || []);
    } catch (error) {
      console.error("Error loading courses:", error.message);
      // Display an error message in the UI instead of an alert
      const errorElement = document.createElement("p");
      errorElement.className = "error-message";
      errorElement.textContent = "Failed to load courses. Please try again later.";
      document.getElementById("coursesGrid")?.appendChild(errorElement);
    }
  }
  
  function displayCourses(subjects) {
    const coursesGrid = document.getElementById("coursesGrid");
    if (!coursesGrid) {
      console.error("Courses grid container not found");
      return;
    }
  
    if (subjects.length === 0) {
      coursesGrid.innerHTML = '<p class="text-muted">No courses enrolled. Click "Find New Courses" to enroll.</p>';
      return;
    }
  
    // Display each subject as a course card
    coursesGrid.innerHTML = subjects
      .map(
        (subject) => `
          <div class="course-card">
            <h3>${subject}</h3>
            <p>Enrolled Course</p>
            <!-- Add more course details or actions if needed -->
          </div>
        `
      )
      .join("");
  }
  
  function openCourseFinder() {
    // Redirect to a course finder page or open a modal
    // For now, let's log a message
    console.log("Opening course finder...");
    // Example: window.location.href = "/student_dashboard/find-courses.html";
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    if (checkAuth()) {
      loadCourses();
    }
  });
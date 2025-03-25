// Utility Functions

// Animate a number from start to end in the given element
function animateNumber(element, start, end) {
    const frames = 60;
    const increment = (end - start) / frames;
    let current = start;
    const animate = () => {
      current += increment;
      element.textContent = Math.round(current);
      if (current < end) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = end;
      }
    };
    animate();
  }
  
  // Edit Profile Navigation
  function editProfile() {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        window.location.href = '/auth_teach.html';
        return;
    }
    localStorage.setItem('editMode', 'true');
    window.location.href = 'teacher_profile_setup.html?edit=true';
}
  
  // Logout Functionality
  function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        // Redirect to auth_teach.html outside the teacher_dashboard folder
        window.location.href = '/auth_teach.html';
    }
  }

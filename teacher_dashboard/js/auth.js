// Authentication Check Function
function checkAuth() {
    const email = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!email || !isLoggedIn) {
      localStorage.clear();
      window.location.href = 'auth_teach.html';
      return false;
    }
    return true;
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  });
  
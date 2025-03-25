// Authentication Check Function
function checkAuth() {
    const email = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userType = localStorage.getItem('userType');
    
    if (!email || !isLoggedIn || userType !== 'student') {
        localStorage.clear();
        window.location.href = '/student_dashboard/auth_stud.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
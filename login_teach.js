// login_teach.js
const initLogin = () => {
    // Check if already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const email = localStorage.getItem('userEmail');
    
    if (isLoggedIn && email) {
        window.location.href = '/teacher_dashboard/index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error('Login form not found');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // Disable button and show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            const response = await fetch('http://localhost:5000/api/teacher/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.success) {
                localStorage.setItem('userEmail', email);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', data.name);
                localStorage.setItem('authToken', data.token);
                
                // Redirect based on profile status
                if (data.hasProfile) {
                    window.location.href = '/teacher_dashboard/index.html';
                } else {
                    window.location.href = 'teacher_profile_setup.html';
                }
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Server error. Please try again later.');
        } finally {
            // Re-enable button and restore text
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    // Handle forgot password
    const forgotPassLink = document.querySelector('.forgot-pass a');
    if (forgotPassLink) {
        forgotPassLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Please contact administrator to reset password');
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initLogin);

export { initLogin };
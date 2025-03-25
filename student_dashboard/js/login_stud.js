// // login_stud.js
// const initLogin = () => {
//     const loginForm = document.getElementById('loginForm');
    
//     if (!loginForm) {
//         console.error('Login form not found');
//         return;
//     }

//     loginForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
        
//         const email = document.getElementById('loginEmail').value;
//         const password = document.getElementById('loginPassword').value;
//         const loginBtn = document.getElementById('loginBtn');
        
//         // Disable button and show loading state
//         loginBtn.disabled = true;
//         loginBtn.textContent = 'Logging in...';

//         try {
//             const response = await fetch('http://localhost:5000/api/student/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ email, password })
//             });

//             const data = await response.json();
            
//             if (!response.ok || !data.success) {
//                 throw new Error(data.error || 'Login failed');
//             }

//             if (data.success) {
//                 localStorage.setItem('userEmail', email);
//                 localStorage.setItem('isLoggedIn', 'true');
//                 window.location.href = '/student_dashboard/index.html';
//             } else {
//                 alert(data.error || 'Login failed');
//             }
//         } catch (error) {
//             console.error('Login error:', error);
//             alert(error.message || 'Server error. Please try again later.');
//         } finally {
//             // Re-enable button and restore text
//             loginBtn.disabled = false;
//             loginBtn.textContent = 'Login';
//         }
//     });
// };

// document.addEventListener('DOMContentLoaded', initLogin);

// export { initLogin };
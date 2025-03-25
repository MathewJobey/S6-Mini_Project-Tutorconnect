// const initSignup = () => {
//     const signUpForm = document.querySelector('#signupForm');
    
//     if (!signUpForm) {
//         console.error('Signup form not found');
//         return;
//     }

//     signUpForm.addEventListener('submit', async (e) => {
//         e.preventDefault();

//         const username = document.getElementById('signupUsername').value;
//         const email = document.getElementById('signupEmail').value;
//         const password = document.getElementById('signupPassword').value;
//         const confirmPassword = document.getElementById('signupConfirmPassword').value;

//         if (password !== confirmPassword) {
//             alert("Passwords don't match!");
//             return;
//         }

//         if (password.length < 6) {
//             alert("Password must be at least 6 characters long!");
//             return;
//         }

//         try {
//             const signupResponse = await fetch('http://localhost:5000/api/student/signup', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     username,
//                     email,
//                     password // REMOVE ROLE!
//                 })
//             });

//             const signupData = await signupResponse.json();

//             if (signupData.success) {
//                 localStorage.setItem('userEmail', email);
//                 localStorage.setItem('isLoggedIn', 'true');
//                 window.location.href = '/student_dashboard/index.html';
//             } else {
//                 alert(signupData.error || 'Failed to create account');
//             }
//         } catch (error) {
//             console.error('Signup error:', error);
//             alert('Server error during signup');
//         }
//     });
// };

// document.addEventListener('DOMContentLoaded', initSignup);

// export { initSignup };
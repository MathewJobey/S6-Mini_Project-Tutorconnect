// Remove Firebase imports
// const firebaseConfig = {
//    ... your config ...
// };

const initSignup = () => {
    const signUpForm = document.querySelector('#signupForm');
    
    if (!signUpForm) {
        console.error('Signup form not found');
        return;
    }

    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long!");
            return;
        }

        try {
            // First create the user account
            const signupResponse = await fetch('http://localhost:5000/api/teacher/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    role: 'teacher'
                })
            });

            const signupData = await signupResponse.json();

            if (signupData.success) {
                // Store login state
                localStorage.setItem('userEmail', email);
                localStorage.setItem('isLoggedIn', 'true');

                // Check if profile exists
                const profileResponse = await fetch('http://localhost:5000/api/teacher/check-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const profileData = await profileResponse.json();

                if (profileData.exists) {
                    window.location.href = '/teacher_dashboard/index.html';
                } else {
                    window.location.href = 'teacher_profile_setup.html';
                }
            } else {
                alert(signupData.error || 'Failed to create account');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Server error during signup');
        }
    });
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSignup);

export { initSignup };

app.post("/api/teacher/check-profile", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const profile = await db.collection("teachers").findOne({ userId: email });

    res.json({
      success: true,
      exists: !!profile, // Return true if the profile exists, false otherwise
    });
  } catch (error) {
    console.error("Profile check error:", error);
    res.status(500).json({
      success: false,
      error: "Server error checking profile",
    });
  }
});
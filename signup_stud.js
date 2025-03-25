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
            const signupResponse = await fetch('http://localhost:5000/api/student/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    role: 'student'
                })
            });

            const signupData = await signupResponse.json();

            if (signupData.success) {
                localStorage.setItem('userEmail', email);
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = '/student_dashboard/index.html';
            } else {
                alert(signupData.error || 'Failed to create account');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Server error during signup');
        }
    });
};

document.addEventListener('DOMContentLoaded', initSignup);

export { initSignup };

app.post("/api/student/check-profile", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const profile = await db.collection("students").findOne({ userId: email });

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

app.post("/api/student/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Validate required fields
    // if (!username || !email || !password) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "All fields are required",
    //   });
    // }
    
    // Check if student already exists
    const existingStudent = await db.collection("students").findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new student
    const newStudent = {
      studentName: username,
      studentEmail: email,
      studentPassword: hashedPassword,
      role: "student",
      createdAt: new Date(),
    };
    
    await db.collection("students").insertOne(newStudent);
    
    res.status(201).json({
      success: true,
      message: "Student account created successfully",
    });
  } catch (error) {
    console.error("Student signup error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during signup",
    });
  }
});
require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const { body, validationResult } = require('express-validator');

const app = express();
const multer = require('multer');
const fs = require('fs');

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const email = req.user ? req.user.email : 'unknown'; // Use req.user.email set by checkAuth
    cb(null, `${email}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 }, // 500KB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});
app.use('/uploads', express.static('uploads'));

// CORS configuration
app.use(cors({
  origin: '*', // For development only.  CHANGE THIS IN PRODUCTION.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Add error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
              success: false,
              error: 'File size exceeds 500KB limit'
          });
      }
  }
  if (err.message === 'Invalid file type. Only images and PDFs are allowed.') {
      return res.status(400).json({
          success: false,
          error: err.message
      });
  }
  console.error('Server error:', err);
  res.status(500).json({
      success: false,
      error: 'Internal server error'
  });
});

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("tutorConnect");

    // Test the connection
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Log the number of users in the database
    const userCount = await db.collection("users").countDocuments();
    console.log('Number of users in database:', userCount);

    console.log("✅ Connected to MongoDB!");

    // Create required indexes
    await db.collection("teachers").createIndex({ userId: 1 }, { unique: true });
    await db.collection("students").createIndex({ userId: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
    await db.collection("verification_requests").createIndex({ email: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours
    await db.collection("teachers").createIndex({ location: "2dsphere" }); // Index for location queries
    await db.collection("verification_log").createIndex({ email: 1 }); // Index for verification log

    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    console.error("Connection string:", mongoURI.replace(/:[^:]*@/, ':****@')); // Hide password
    return false;
  }
}

// Move the server start inside the connection callback
connectDB().then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${port} is already in use. Please try these steps:`);
      console.error('1. Kill the existing process');
      console.error('2. Try a different port by setting PORT in .env');
      console.error('3. Wait a few seconds and try again');
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Add this validation function at the top of server.js
function validatePhoneNumber(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

function validateAadhar(aadhar) {
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadhar);
}

async function reverseGeocode(latitude, longitude) {
  const apiKey = process.env.OPENCAGE_API_KEY; // Get API key from .env
  if (!apiKey) {
    throw new Error('OpenCage API key not found in environment variables.');
  }
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error with the reverse geocoding service');
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted; // Return the full formatted address
    } else {
      throw new Error('No address found for the provided coordinates.');
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

// Teacher Profile Flow
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

// Student Profile Flow - Check if profile exists
app.post("/api/student/check-profile", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const studentProfile = await db.collection("students").findOne({ userId: email });
    const exists = !!studentProfile;

    res.json({
      success: true,
      exists: exists,
    });
  } catch (error) {
    console.error("Error checking profile:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// Create/Update teacher profile
app.post("/api/teacher/profile", async (req, res) => {
  try {
    const { email, name, gender, age, dob, phone, aadhar, subjects, experience, address, latitude, longitude } = req.body;

    if (!email || !name || !gender || !age || !dob || !phone || !aadhar || !subjects || !experience) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    const teacherData = {
      userId: email,
      name,
      gender,
      age: parseInt(age),
      dob: new Date(dob),
      phone,
      aadhar,
      subjects,
      experience,
      address,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      verificationStatus: "Pending",
      profileComplete: true,
      lastUpdated: new Date()
    };

    const existingProfile = await db.collection("teachers").findOne({ userId: email });

    if (existingProfile) {
        delete teacherData.createdAt; //prevent from updating
        await db.collection("teachers").updateOne({ userId: email }, { $set: teacherData });
        res.status(200).json({  //Updated to 200
          success: true,
          message: "Profile updated successfully"
        });
    } else {
      teacherData.createdAt = new Date(); // Set createdAt only when creating
      await db.collection("teachers").insertOne(teacherData);
       res.status(201).json({  //Updated to 201
          success: true,
          message: "Profile created successfully"
        });
    }


  } catch (error) {
    console.error("Profile save error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save profile"
    });
  }
});
// Ensure checkAuth is defined before routes
const checkAuth = async (req, res, next) => {
  const email = req.headers.authorization;
  if (!email) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  try {
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }
    req.user = user; // Set req.user with the full user object
    req.body.email = user.email; // Explicitly set req.body.email for Multer
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: "Server error during authentication"
    });
  }
};

// Create/Update student profile
app.post("/api/student/profile", checkAuth, upload.single('identificationCard'), async (req, res) => {
  try {
      const {
          email, name, gender, age, dob, phone, aadhar, educationLevel, subjects,
          address, parentName, parentPhone, latitude, longitude, bio
      } = req.body;

      const identificationCard = req.file ? req.file.path : null;

      if (!email || !name || !gender || !age || !dob || !phone || !aadhar ||
          !educationLevel || !subjects || !address || !parentName || !parentPhone ||
          !latitude || !longitude) {
          return res.status(400).json({
              success: false,
              error: "All required fields must be filled"
          });
      }

      if (!validateAadhar(aadhar)) {
          return res.status(400).json({
              success: false,
              error: "Invalid Aadhar number. Must be 12 digits."
          });
      }

      const subjectsArray = Array.isArray(subjects) ? subjects : [subjects];
      const studentData = {
        userId: email,
        name,
        gender,
        age: parseInt(age, 10),
        dob: new Date(dob),
        phone,
        aadhar,
        educationLevel,
        subjects: subjectsArray,
        address,
        parentName,
        parentPhone,
        location: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        identificationCard,
        bio: bio || '',
        profileComplete: true,
        verificationStatus: "Pending", // Add this field for new profiles
        lastUpdated: new Date()
    };
    
    // Check if profile exists
    const existingProfile = await db.collection("students").findOne({ userId: email });
    
    if (existingProfile) {
        const updateData = { ...studentData };
        if (req.file) {
            updateData.identificationCard = req.file.path;
        } else {
            updateData.identificationCard = existingProfile.identificationCard;
        }
        // Preserve existing verificationStatus during updates
        delete updateData.verificationStatus;
        delete updateData.createdAt;
        await db.collection("students").updateOne({ userId: email }, { $set: updateData });
        res.status(200).json({
            success: true,
            message: "Profile updated successfully"
        });
    } else {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Identification card is required"
            });
        }
        studentData.identificationCard = req.file.path;
        studentData.createdAt = new Date();
        await db.collection("students").insertOne(studentData);
        res.status(201).json({
            success: true,
            message: "Profile created successfully"
        });
    }

  } catch (error) {
      console.error("Student profile save error:", error);
      res.status(500).json({
          success: false,
          error: "Failed to save student profile"
      });
  }
});

// Get teacher profile
app.get("/api/teacher/profile/:email", checkAuth, async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const profile = await db.collection("teachers").findOne({
      userId: email
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found"
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get student profile
app.get("/api/student/profile/:email", checkAuth, async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const profile = await db.collection("students").findOne({
      userId: email
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Student profile not found"
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all teachers (for testing)
app.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await db.collection("teachers").find({}).toArray();
    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all students (for testing)
app.get("/api/students", async (req, res) => {
  try {
    const students = await db.collection("students").find({}).toArray();
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Teacher Login
app.post("/api/teacher/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const user = await db.collection("users").findOne({
      email: email,
      role: "teacher"
    });

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Check for profile completion here
    const teacherProfile = await db.collection("teachers").findOne({ userId: email });
    const profileComplete = teacherProfile && teacherProfile.profileComplete;

    console.log('Successful login for:', email, 'Profile Complete:', profileComplete);
    res.json({
      success: true,
      email: user.email,
      profileComplete: profileComplete // Include profileComplete status in the response
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login"
    });
  }
});

// Student Login
app.post("/api/student/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Student login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }
    
    const user = await db.collection("users").findOne({  
      email: email,
      role: "student"
    });
    
    if (!user) {
      console.log('Student not found:', email);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      console.log('Invalid password for student:', email);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Check for profile completion
    const studentProfile = await db.collection("students").findOne({ userId: email });
    const profileComplete = studentProfile && studentProfile.profileComplete;

    console.log('Successful student login for:', email, 'Profile Complete:', profileComplete);
    res.json({
      success: true,
      email: user.email,
      profileComplete: profileComplete // Include profileComplete status
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login"
    });
  }
});
// Student Signup (Simplified with Role set)
app.post("/api/student/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Minimal validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: "All fields required" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user - ROLE IS HARDCODED
    await db.collection("users").insertOne({
      username,
      email,
      password: hashedPassword,
      role: "student",
      createdAt: new Date(),
    });

    res.status(201).json({ success: true, message: "Student account created" });

  } catch (error) {
    console.error("Student signup error:", error);
    res.status(500).json({ success: false, error: "Signup failed" });
  }
});

// Test endpoint to check database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const dbStatus = {
      connected: true, // If we reach here, we're connected
      collections: await db.listCollections().toArray(),
      userCount: await db.collection("users").countDocuments(),
      teacherCount: await db.collection("teachers").countDocuments(),
      studentCount: await db.collection("students").countDocuments() // Added for students
    };
    res.json(dbStatus);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Teacher Signup
app.post("/api/teacher/signup", [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
],async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.collection("users").insertOne({
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully"
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during signup"
    });
  }
});

// Create verification request
app.post("/api/teacher/verification-request", async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    // Create verification request
    await db.collection("verification_requests").insertOne({
      email,
      name,
      phone,
      status: 'pending',
      createdAt: new Date(),
      documents: [], // For future document uploads
      verificationStatus: 'Pending',
      remarks: ''
    });

    res.status(200).json({
      success: true,
      message: "Verification request submitted successfully"
    });
  } catch (error) {
    console.error("Verification request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit verification request"
    });
  }
});

// Get all verification requests
app.get("/api/admin/verification-requests", async (req, res) => {
  try {
    // Verify admin token (using a simple check for now, as seen in other admin routes)
    const adminToken = req.headers.authorization;
    if (!adminToken || adminToken !== "admin-token") {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Fetch pending students
    const pendingStudents = await db.collection("students")
      .find({ verificationStatus: "Pending" })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch pending teachers
    const pendingTeachers = await db.collection("teachers")
      .find({ verificationStatus: "Pending" })
      .sort({ createdAt: -1 })
      .toArray();

    // Format the response for students
    const studentsFormatted = pendingStudents.map(student => ({
      email: student.userId,
      name: student.name,
      phone: student.phone,
      verificationStatus: student.verificationStatus || "Pending",
      createdAt: student.createdAt,
      remarks: student.remarks || '',
      type: "student"
    }));

    // Format the response for teachers
    const teachersFormatted = pendingTeachers.map(teacher => ({
      email: teacher.userId,
      name: teacher.name,
      phone: teacher.phone,
      verificationStatus: teacher.verificationStatus || "Pending",
      createdAt: teacher.createdAt,
      remarks: teacher.remarks || '',
      type: "teacher"
    }));

    // Combine the lists
    const requests = [...studentsFormatted, ...teachersFormatted];

    res.json(requests);
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch verification requests"
    });
  }
});

// Find teachers by location and subjects
// Find teachers by location and subjects
app.post("/api/student/find-teachers", async (req, res) => {
  try {
    const { latitude, longitude, subjects, maxDistance = 10000 } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Location coordinates are required"
      });
    }

    // Create the query
    let query = {
      verificationStatus: "Verified",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance // in meters
        }
      }
    };

    // Add subjects filter if provided
    if (subjects && subjects.length > 0) {
      query.subjects = { $in: subjects };
    }

    // Find teachers and include required fields
    const teachers = await db.collection("teachers")
      .find(query)
      .project({
        userId: 1,
        name: 1,
        subjects: 1,
        experience: 1,
        location: 1,
        age: 1, // Include age
        phone: 1, // Include phone
        email: 1, // Include email (userId is already the email, but we'll include it explicitly)
        _id: 0
      })
      .toArray();

    res.json({
      success: true,
      teachers
    });
  } catch (error) {
    console.error("Error finding teachers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find teachers"
    });
  }
});

// Update verification status
app.post("/api/admin/verify-teacher", async (req, res) => {
  try {
    const { email, status, remarks } = req.body;

    // Update teacher's verification status
    await db.collection("teachers").updateOne(
      { userId: email },
      {
        $set: {
          verificationStatus: status,
          remarks,
          updatedAt: new Date()
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating verification status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update verification status"
    });
  }
});

// Get teacher details for admin
app.get("/api/admin/teacher-details/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log('Fetching details for email:', email);

    // Use a case-insensitive query
    const teacher = await db.collection("teachers").findOne({
      userId: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    console.log('Found teacher:', teacher);

    if (!teacher) {
      console.log('No teacher found with email:', email);
      return res.status(404).json({
        success: false,
        error: "Teacher not found"
      });
    }

    // Format the response
    const formattedTeacher = {
      name: teacher.name || 'N/A',
      userId: teacher.userId || email,
      phone: teacher.phone || 'N/A',
      gender: teacher.gender || 'N/A',
      age: teacher.age || 'N/A',
      dob: teacher.dob || new Date(),
      experience: teacher.experience || 'N/A',
      subjects: teacher.subjects || [],
      aadhar: teacher.aadhar || 'N/A',
      verificationStatus: teacher.verificationStatus || 'Pending',
      createdAt: teacher.createdAt || new Date(),
      remarks: teacher.remarks || 'No remarks'
    };

    res.json(formattedTeacher);
  } catch (error) {
    console.error("Error fetching teacher details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch teacher details"
    });
  }
});
// Fetch all pending student verification requests
app.get("/api/admin/student-verification-requests", async (req, res) => {
  try {
    const adminToken = req.headers.authorization;
    if (!adminToken || adminToken !== "admin-token") {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const students = await db.collection("students")
      .find({ verificationStatus: "Pending" })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedStudents = students.map(student => ({
      userId: student.userId,
      name: student.name,
      phone: student.phone,
      school: student.educationLevel, // Using educationLevel as "school" for display
      grade: student.grade || "N/A",
      verificationStatus: student.verificationStatus,
      createdAt: student.createdAt
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error("Error fetching student verification requests:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Verify or reject a student
app.post("/api/admin/verify-student", async (req, res) => {
  try {
    const adminToken = req.headers.authorization;
    if (!adminToken || adminToken !== "admin-token") {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { email, status, remarks } = req.body;
    if (!email || !status) {
      return res.status(400).json({ success: false, error: "Email and status are required" });
    }

    const student = await db.collection("students").findOne({ userId: email });
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    // Update student verification status
    await db.collection("students").updateOne(
      { userId: email },
      { $set: { verificationStatus: status, remarks: remarks || "", updatedAt: new Date() } }
    );

    // Log the verification action in verification_log
    await db.collection("verification_log").insertOne({
      email,
      name: student.name,
      role: "Student",
      status,
      remarks: remarks || "No remarks",
      updatedAt: new Date(),
    });

    res.json({ success: true, message: "Student verification updated" });
  } catch (error) {
    console.error("Error verifying student:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
// Get student details for admin
app.get("/api/admin/student-details/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log('Fetching student details for email:', email);

    // Use a case-insensitive query
    const student = await db.collection("students").findOne({
      userId: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    console.log('Found student:', student);

    if (!student) {
      console.log('No student found with email:', email);
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Format the response
    const formattedStudent = {
      name: student.name || 'N/A',
      userId: student.userId || email,
      phone: student.phone || 'N/A',
      gender: student.gender || 'N/A',
      age: student.age || 'N/A',
      dob: student.dob || new Date(),
      educationLevel: student.educationLevel || 'N/A',
      subjects: student.subjects || [],
      parentName: student.parentName || 'N/A',
      parentPhone: student.parentPhone || 'N/A',
      createdAt: student.createdAt || new Date()
    };

    res.json(formattedStudent);
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch student details"
    });
  }
});

// Get all students - admin view
app.get("/api/admin/students", async (req, res) => {
  try {
    const students = await db.collection("students")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formattedStudents = students.map(student => ({
      name: student.name,
      email: student.userId,
      phone: student.phone,
      educationLevel: student.educationLevel,
      subjects: student.subjects,
      createdAt: student.createdAt
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error("Error fetching all students:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch students"
    });
  }
});

// Submit tutor request
app.post("/api/student/request-tutor", async (req, res) => {
  try {
    const { studentId, teacherId, subjects, schedule, message } = req.body;

    if (!studentId || !teacherId || !subjects || !schedule) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    // Get student and teacher details
    const student = await db.collection("students").findOne({ userId: studentId });
    const teacher = await db.collection("teachers").findOne({ userId: teacherId });

    if (!student || !teacher) {
      return res.status(404).json({
        success: false,
        error: "Student or teacher not found"
      });
    }

    // Create tutor request
    const requestData = {
      studentId,
      teacherId,
      studentName: student.name,
      teacherName: teacher.name,
      subjects,
      schedule,
      message,
      status: "Pending", // Pending, Accepted, Rejected
      createdAt: new Date()
    };

    await db.collection("tutor_requests").insertOne(requestData);

    res.status(201).json({
      success: true,
      message: "Tutor request submitted successfully"
    });
  } catch (error) {
    console.error("Error submitting tutor request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit tutor request"
    });
  }
});

// Get student's tutor requests
app.get("/api/student/tutor-requests/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const requests = await db.collection("tutor_requests")
      .find({ studentId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (error) {
    console.error("Error fetching student tutor requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tutor requests"
    });
  }
});

// Get teacher's tutor requests
app.get("/api/teacher/tutor-requests/:teacherId", async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    const requests = await db.collection("tutor_requests")
      .find({ teacherId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (error) {
    console.error("Error fetching teacher tutor requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tutor requests"
    });
  }
});

// Update tutor request status
app.post("/api/teacher/update-request", async (req, res) => {
  try {
    const { requestId, status, remarks } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        error: "Request ID and status are required"
      });
    }

    await db.collection("tutor_requests").updateOne(
      { _id: new require('mongodb').ObjectId(requestId) },
      {
        $set: {
          status,
          remarks,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: "Request status updated successfully"
    });
  } catch (error) {
    console.error("Error updating tutor request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update tutor request"
    });
  }
});

// Get verification log
app.get("/api/admin/verification-log", async (req, res) => {
  try {
    const logs = await db.collection("verification_log")
      .find()
      .sort({ updatedAt: -1 })
      .toArray();

    res.json(logs);
  } catch (error) {
    console.error("Error fetching verification log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch verification log"
    });
  }
});
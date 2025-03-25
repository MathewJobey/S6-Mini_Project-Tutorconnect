const bcrypt = require("bcryptjs");

// Function to hash a password
const hashPassword = async (password) => {
    try {
        const saltRounds = 10; // Number of salt rounds
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Hashed Password:", hashedPassword);
        return hashedPassword;
    } catch (error) {
        console.error("Error hashing password:", error);
    }
};

// Example usage
const password = "SecurePassword123";
hashPassword(password);
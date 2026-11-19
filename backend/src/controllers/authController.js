
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      role,
      location,
    } = req.body;

    // 1. Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof phone !== "string" ||
      typeof password !== "string" ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, password, and role are required",
      });
    }

    // 2. Validate role
    if (!["farmer", "buyer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be farmer or buyer",
      });
    }

    // 3. Validate password
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters",
      });
    }

    // 4. Normalize and validate phone number
    const normalizedPhone = phone.replace(/[\s()-]/g, "");

    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number with country code if needed",
      });
    }

    // 5. Validate optional email
    let normalizedEmail;

    if (email !== undefined && email !== null && email !== "") {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Email must be a string",
        });
      }

      normalizedEmail = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address",
        });
      }
    }

    // 6. Check for an existing phone number
    const existingUser = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered",
      });
    }

    // 7. Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    const userData = {
      name: name.trim(),
      phone: normalizedPhone,
      password: hashedPassword,
      role,
    };

    if (normalizedEmail) {
      userData.email = normalizedEmail;
    }

    if (location !== undefined) {
      userData.location = location;
    }

    // 8. Save user to MongoDB
    const user = await User.create(userData);

    // 9. Return safe user details (never return password)
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        location: user.location,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // Handles duplicate-key errors, including concurrent requests
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message:
          field === "email"
            ? "This email is already registered"
            : "This phone number or account detail is already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed due to a server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    const normalizedPhone = phone.replace(/[\s()-]/g, "");

    const user = await User.findOne({
      phone: normalizedPhone,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed due to a server error",
    });
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};



module.exports = {
  register,
  login,
  getMe,
};

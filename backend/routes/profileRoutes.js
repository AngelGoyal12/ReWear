
const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in user's profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, created_at, is_verified
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: users[0] });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({
      message: "Unable to fetch profile"
    });
  }
});

// Update logged-in user's profile
router.put("/", authMiddleware, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Name is required"
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        message: "Name must not exceed 100 characters"
      });
    }

    const [result] = await pool.query(
      "UPDATE users SET name = ? WHERE id = ?",
      [name, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const [users] = await pool.query(
      `SELECT id, name, email, created_at, is_verified
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    return res.json({
      message: "Profile updated successfully",
      user: users[0]
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Unable to update profile"
    });
  }
});

module.exports = router;

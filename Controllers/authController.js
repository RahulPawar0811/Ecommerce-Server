const jwt = require('jsonwebtoken');
require('dotenv').config();
const mysql = require("mysql2/promise");
const { dbConfig } = require('../Config/dbConfig');

const secretKey = process.env.JWT_SECRET; // Access the JWT secret from .env

async function login(req, res) {
  const { username, password } = req.body;

  try {
    // ✅ Establish database connection
    const connection = await mysql.createConnection(dbConfig);

    // ✅ Execute the query using `await`
    const query = `
      SELECT 
        l.UserId, l.First_Name, l.Last_Name, l.Email, l.Mobile, l.Password, l.Role, l.Org_ID, l.Photo, l.Branch_Id,
        o.IsSubCat, o.IsVariant, o.Variant, o.IsInventory, o.IsDealer
      FROM Login l
      INNER JOIN Organization o ON l.Org_ID = o.Org_ID
      WHERE l.Username = ?
    `;
    
    const [rows] = await connection.execute(query, [username]);

    // ✅ Close the connection
    await connection.end();

    // ✅ Check if a user was found
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];

    // ✅ Compare the provided password with the stored password
    if (password !== user.Password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // ✅ Generate JWT token including only relevant user data
    const tokenData = { ...user };
    const token = jwt.sign(tokenData, secretKey, { expiresIn: "9h" });

    // ✅ Set JWT in HTTP-Only cookie
    res.cookie('AdminToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.json({ Success: "Success", ...tokenData });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// ✅ Logout function
const logout = (req, res) => {
  res.cookie("AdminToken", "", {
    secure: true,
    sameSite: "None",
    expires: new Date(0),
  });
  res.json({ Status: "Success", Message: "Logged out successfully" });
};

module.exports = { login, logout };

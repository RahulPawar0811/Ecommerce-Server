const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const {connectDatabase, dbConfig} = require('./Config/dbConfig');
dotenv.config(); // Load environment variables
const routes = require('./Routes/routes')
const cookieParser = require('cookie-parser');
const path = require('path');



const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'Client', 'public', 'assets')));

const corsOptions = {
  origin: 'http://localhost:3000',  // Allow frontend's origin
  credentials: true,               // Allow cookies/auth tokens
  optionSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "build")));


// Middleware to parse cookies
app.use(cookieParser());
// Establish Database Connection
const sql = require("mysql2");



sql.createPool(dbConfig).getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("✅ Connected to the database.");
    connection.release();
  }
});
app.use('/', routes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

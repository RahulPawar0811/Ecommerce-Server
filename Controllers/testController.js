// Controllers/testController.js
const { dbConfig } = require("../Config/dbConfig");
const mysql = require("mysql2/promise");



// Define functions to handle requests
const getWelcomeMessage = (req, res) => {
    res.send('Welcome to the API!');
  };
  
  const getData = (req, res) => {
    res.send('Data fetched successfully!');
  };


  const getUsers = async (req, res) => {
    try {
      // ✅ Create a connection using async/await
      const connection = await mysql.createConnection(dbConfig);
  
      // ✅ Execute the query using `await`
      const [rows] = await connection.execute('SELECT * FROM Login');
  
      // ✅ Close the connection
      await connection.end();
  
      // ✅ Send response
      res.json(rows);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  
  
  // Export the functions to be used in routes
  module.exports = {
    getWelcomeMessage,
    getData,
    getUsers
  };
  
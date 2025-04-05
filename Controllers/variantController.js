const {dbConfig} = require('../Config/dbConfig'); // Import DB connection
const mysql = require('mysql2/promise')

const addVariantTypes = async (req, res) => {
  const { Org_Id, Admin_Id, VariantType, AddedBy } = req.body;

  try {
    if (!Org_Id || !Admin_Id || !VariantType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const connection = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO masysecommerce.VariantType (Org_Id, Admin_Id, Branch_Id, VariantType, AddedOn, AddedBy) VALUES (?, ?, 'All', ?, NOW(), ?)`;
    
    await connection.execute(query, [Org_Id, Admin_Id, VariantType, AddedBy]);
    
    res.status(201).json({ message: 'Variant type added successfully!' });
  } catch (error) {
    console.error("Error inserting variant type:", error);
    res.status(500).json({ message: 'An error occurred while adding the variant type.', error: error.message });
  }
};

const viewVariantTypes = async (req, res) => {
  try {
    const { Org_Id } = req.params;
    if (!Org_Id) {
      return res.status(400).json({ error: "Org_Id is required" });
    }

    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT Sr_No, Org_Id, Admin_Id, Branch_Id, VariantType, AddedOn, AddedBy FROM masysecommerce.VariantType WHERE Org_Id = ?`;
    
    const [results] = await connection.execute(query, [Org_Id]);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching variant types:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteVariantTypes = async (req, res) => {
  const { Sr_No } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `DELETE FROM masysecommerce.VariantType WHERE Sr_No = ?`;
    
    const [result] = await connection.execute(query, [Sr_No]);
    
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "Variant Type deleted successfully" });
    } else {
      return res.status(404).json({ message: "Variant Type not found" });
    }
  } catch (error) {
    console.error("Error deleting Variant Type:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { addVariantTypes, viewVariantTypes, deleteVariantTypes };
const mysql = require("mysql2/promise");
const { connectDatabase, dbConfig } = require("../Config/dbConfig");
const { configureMulter, deleteImage } = require("../Config/multerConfig");

async function addSubCategories(req, res) {
  const {
    Cat_Id,
    Sub_Cat_Name,
    Cat_Desc,
    SortOrder,
    Status = 1,
    Admin_Id,
    Added_By,
    SEOTitle,
    SEODes,
    SeoKeyword,
    Org_Id,
  } = req.body;

  const Branch_Id = "All";
  const Cat_Img = req.file ? req.file.filename : null;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Fetch the Cat_Name based on Cat_Id
    const [result] = await connection.execute(
      `SELECT Cat_Name FROM Category WHERE Cat_Id = ?`,
      [Cat_Id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { Cat_Name } = result[0];

    // Insert new subcategory
    await connection.execute(
      `INSERT INTO Sub_Category (Org_Id, Branch_Id, Cat_Id, Sub_Cat_Name, Cat_Name, Cat_Desc, Cat_Img, 
        SortOrder, Status, Added_On, Added_By, Admin_Id, SEOTitle, SEODes, SeoKeyword) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [Org_Id, Branch_Id, Cat_Id, Sub_Cat_Name, Cat_Name, Cat_Desc, Cat_Img, SortOrder, Status, Added_By, Admin_Id, SEOTitle, SEODes, SeoKeyword]
    );

    res.status(201).json({ message: "Subcategory added successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const viewSubCategories = async (req, res) => {
  const { orgId, catId } = req.query;
  
  try {
    const connection = await mysql.createConnection(dbConfig);

    let query = `SELECT * FROM Sub_Category WHERE Org_ID = ?`;
    let params = [orgId];

    if (catId) {
      query += ` AND Cat_Id = ?`;
      params.push(catId);
    }

    const [result] = await connection.execute(query, params);

    if (result.length === 0) {
      return res.status(404).json({ message: "No sub-categories found" });
    }

    res.status(200).json({ subCategories: result });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while fetching sub-categories" });
  }
};

const editSubCategories = async (req, res) => {
  const { Cat_Id } = req.params;
  const { Sub_Cat_Name, Cat_Name, Cat_Desc, SortOrder, Status = 1, SEOTitle, SEODes, SeoKeyword } = req.body;
  const Cat_Img = req.file ? req.file.filename : null;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [imageResult] = await connection.execute(
      `SELECT Cat_Img FROM Sub_Category WHERE Cat_Id = ?`,
      [Cat_Id]
    );

    const currentImage = imageResult[0]?.Cat_Img;

    if (Cat_Img && currentImage) {
      deleteImage(currentImage, "Sub-Category");
    }

    await connection.execute(
      `UPDATE Sub_Category SET Sub_Cat_Name = ?, Cat_Name = ?, Cat_Desc = ?, Cat_Img = COALESCE(?, Cat_Img), 
        SortOrder = ?, Status = ?, SEOTitle = ?, SEODes = ?, SeoKeyword = ? WHERE Cat_Id = ?`,
      [Sub_Cat_Name, Cat_Name, Cat_Desc, Cat_Img, SortOrder, Status, SEOTitle, SEODes, SeoKeyword, Cat_Id]
    );

    res.status(200).json({ message: "Sub-category updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while updating the sub-category" });
  }
};

const deleteSubCategories = async (req, res) => {
  const { Id } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [imageResult] = await connection.execute(
      `SELECT Cat_Img FROM Sub_Category WHERE Id = ?`,
      [Id]
    );

    if (imageResult.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const subCatImage = imageResult[0].Cat_Img;

    await connection.execute(
      `DELETE FROM Sub_Category WHERE Id = ?`,
      [Id]
    );

    if (subCatImage) {
      deleteImage(subCatImage, "Sub-Category");
    }

    res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting subcategory" });
  }
};

module.exports = { addSubCategories, viewSubCategories, editSubCategories, deleteSubCategories };
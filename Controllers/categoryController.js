const mysql = require('mysql2/promise');
const { connectDatabase, dbConfig } = require('../Config/dbConfig');
const { deleteImage } = require('../Config/multerConfig');

async function addCategories(req, res) {
  const {
    Org_Id,
    Branch_Id = 'All',
    Admin_Id,
    Cat_Name,
    Cat_Desc,
    ShowOnHomePage,
    SortOrder,
    Status = 1,
    Added_By,
    SEOTitle,
    SEODes,
    SEOKeyword,
  } = req.body;

  const Cat_Img = req.file ? req.file.filename : null;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO Category (
        Org_Id, Branch_Id, Admin_Id, Cat_Name, Cat_Desc, Cat_Img,
        ShowOnHomePage, SortOrder, Status, Added_On, Added_By,
        SEOTitle, SEODes, SEOKeyword
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [
        Org_Id, Branch_Id, Admin_Id, Cat_Name, Cat_Desc, Cat_Img,
        ShowOnHomePage, SortOrder, Status, Added_By,
        SEOTitle, SEODes, SEOKeyword,
      ]
    );
    res.status(201).json({ message: 'Category added successfully!' });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function viewAllCategories(req, res) {
  const { Org_Id } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [categories] = await connection.execute(
      `SELECT * FROM Category WHERE Org_Id = ?`,
      [Org_Id]
    );
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
}

async function viewCategories(req, res) {
  const { Org_Id } = req.params;
  const { page = 1, limit = 10, search = '', sortOrder = 'ASC' } = req.query;

  if (!Org_Id || isNaN(Org_Id)) {
    return res.status(400).json({ error: 'Invalid or missing Org_Id' });
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  const validSortOrders = ['ASC', 'DESC'];
  const sortOrderValidated = validSortOrders.includes(sortOrder.toUpperCase())
    ? sortOrder.toUpperCase()
    : 'ASC';

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Corrected SQL syntax
    const [categories] = await connection.execute(
      `SELECT * FROM category 
       WHERE Org_Id = ? AND Cat_Name LIKE ? 
       ORDER BY SortOrder ASC 
       LIMIT 10`,
      [parseInt(Org_Id), `%${search}%`]
    );
    

    const [[{ totalCount }]] = await connection.execute(
      `SELECT COUNT(*) AS totalCount 
       FROM category 
       WHERE Org_Id = ? AND Cat_Name LIKE ?`,
      [Org_Id, `%${search}%`]
    );

    res.json({
      categories,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Server Error');
  }
}




async function editCategories(req, res) {
  const { Cat_Id } = req.params;
  const {
    Cat_Name, Cat_Desc, ShowOnHomePage, SortOrder, SEOTitle, SEODes, SEOKeyword
  } = req.body;
  const Cat_Img = req.file ? req.file.filename : null;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [[category]] = await connection.execute(
      `SELECT Cat_Img FROM Category WHERE Cat_Id = ?`,
      [Cat_Id]
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (Cat_Img && category.Cat_Img) {
      deleteImage(category.Cat_Img, 'categories');
    }

    await connection.execute(
      `UPDATE Category SET Cat_Name = ?, Cat_Desc = ?, Cat_Img = COALESCE(?, Cat_Img),
      ShowOnHomePage = ?, SortOrder = ?, SEOTitle = ?, SEODes = ?, SEOKeyword = ?,
      Added_On = NOW() WHERE Cat_Id = ?`,
      [Cat_Name, Cat_Desc, Cat_Img, ShowOnHomePage, SortOrder, SEOTitle, SEODes, SEOKeyword, Cat_Id]
    );

    res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Database update error:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
}

async function deleteCategories(req, res) {
  const { Cat_Id } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [[category]] = await connection.execute(
      `SELECT Cat_Img FROM Category WHERE Cat_Id = ?`,
      [Cat_Id]
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await connection.execute(`DELETE FROM Category WHERE Cat_Id = ?`, [Cat_Id]);

    if (category.Cat_Img) {
      deleteImage(category.Cat_Img, 'categories');
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error while deleting category' });
  }
}

module.exports = { viewCategories, addCategories, editCategories, deleteCategories, viewAllCategories };

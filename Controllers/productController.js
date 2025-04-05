const {dbConfig} = require("../Config/dbConfig");
const mysql = require('mysql2/promise')
const {configureMulter, deleteImage} = require('../Config/multerConfig')


const addProducts = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  const productDetail = req.body;
  const featuredImage = req.files?.Featured_Img?.[0]?.filename || null;
  const multipleImages = req.files?.multipleImages?.map(file => file.filename) || [];
  const featured_image = req.files?.Featured_Image?.map(file => file.filename) || [];
  const variants = productDetail.variants || [];

  let parsedDetails = null;
  if (typeof productDetail.variants === 'string') {
      try {
          const sanitizedString = productDetail.variants.trim().replace(/'/g, '"');
          parsedDetails = JSON.parse(sanitizedString);
      } catch (error) {
          console.error("Error parsing JSON:", error);
      }
  } else {
      parsedDetails = productDetail.variants;
  }

  let transaction;
  try {
      transaction = await connection.beginTransaction();

  const productQuery = `
            INSERT INTO Product 
            (Org_Id, Admin_Id, Branch_Id, Prod_Code, Cat_Id, Cat_Name, Sub_Cat_Id, Sub_at_Name, Prod_Name, 
            HSN_Code, Featured_Img, Img_360, Short_Description, VideoLink, Brand_Name, Manufacturer_Name, Avg_Rating, Prod_Description,
            Purchase_Price, MRP, Web_Price, Store_Price, InStock, Is_Variant, VarientType, GST_Applicable, GST_Category,
            GST_Rate, Unit_id, UnitOfMeasurement, Status, Added_On, Added_By, Qty, SEOTitle, SEODes, 
            SEOKeyword, Param1, Param1_Val, Param2, Param2_Val, Param3, Param3_Val, Param4, Param4_Val,
            Param5, Param5_Val) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, NOW(), ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?)
        `;
      const [productResult] = await connection.execute(productQuery, [
          productDetail.Org_Id, productDetail.Admin_Id, productDetail.Branch_Id,
          productDetail.Prod_Code, productDetail.Cat_Id, productDetail.Cat_Name,
          productDetail.Sub_Cat_Id || null, productDetail.Sub_at_Name || null, productDetail.Prod_Name,
          productDetail.HSN_Code, featuredImage, productDetail.Img_360,
          productDetail.Short_Description, productDetail.VideoLink, productDetail.Brand_Name,
          productDetail.Manufacturer_Name, productDetail.Avg_Rating, productDetail.Prod_Description,
          productDetail.Purchase_Price, productDetail.MRP, productDetail.Web_Price,
          productDetail.Store_Price, productDetail.InStock, productDetail.Is_Variant,
          productDetail.VarientType, productDetail.GST_Applicable || null, productDetail.GST_Category || null,
          productDetail.GST_Rate || null, productDetail.Unit_id || null, productDetail.UnitOfMeasurement || null,
          productDetail.Status, productDetail.Added_By, productDetail.Qty,
          productDetail.SEOTitle, productDetail.SEODes, productDetail.SEOKeyword,
          productDetail.Param1, productDetail.Param1_Val, productDetail.Param2,
          productDetail.Param2_Val, productDetail.Param3, productDetail.Param3_Val,
          productDetail.Param4, productDetail.Param4_Val, productDetail.Param5,
          productDetail.Param5_Val
      ]);

      const productId = productResult.insertId;

      if (productDetail.Is_Variant === "1" && variants.length) {
          for (const variantData of variants) {
              const variant = JSON.parse(variantData);
              const variantQuery = `INSERT INTO Product_Variants_new 
                  (Product_Id, Org_Id, Variant1_Id, Variant_Name1, Value1_Id, Variant_Value1, 
                  Variant2_Id, Variant_Name2, Value2_Id, Variant_Value2, Barcode, Purchase_Price, 
                  MRP, Web_Price, Store_Price, Stock, Qty, Product_Name, Featured_Image, Added_By, 
                  Added_On, Status, UnitOfMeasurement, VarientType) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`;

              const featured_Image = featured_image.length > 0 ? featured_image.shift() : null;
              const [variantResult] = await connection.execute(variantQuery, [
                  productId, productDetail.Org_Id, variant.Variant1_Id, variant.Variant_Name1,
                  variant.Value1_Id, variant.Variant_Value1, variant.Variant2_Id,
                  variant.Variant_Name2, variant.Value2_Id, variant.Variant_Value2,
                  variant.Barcode, variant.Purchase_Price, variant.MRP, variant.Web_Price,
                  variant.Store_Price, variant.Stock, variant.Qty, variant.Product_Name,
                  featured_Image, variant.Added_By, 1, productDetail.UnitOfMeasurement,
                  productDetail.VarientType
              ]);
              const variantId = variantResult.insertId;

              if (variant.Image_Name && variant.Image_Name.length > 0) {
                  for (const imageName of variant.Image_Name) {
                      const variantImageQuery = `INSERT INTO Varient_Multiple_Img 
                          (Var_Id, Org_Id, Admin_Id, Branch_Id, Image_Name, Added_On, Added_By, Status) 
                          VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`;
                      await connection.execute(variantImageQuery, [
                          variantId, productDetail.Org_Id, productDetail.Admin_Id,
                          productDetail.Branch_Id, imageName, productDetail.Added_By, 1
                      ]);
                  }
              }
          }
      }

      if (multipleImages.length > 0) {
          for (const image of multipleImages) {
              const imageQuery = `INSERT INTO Product_Multiple_Img 
                  (Prod_Id, Image_Name, Org_Id, Admin_Id, Branch_Id, Added_On, Added_By, Status) 
                  VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`;
              await connection.execute(imageQuery, [
                  productId, image, productDetail.Org_Id, productDetail.Admin_Id,
                  productDetail.Branch_Id, productDetail.Added_By, 1
              ]);
          }
      }

      await connection.commit();
      res.status(200).json({ message: "Product added successfully!" });
  } catch (error) {
      if (transaction) await connection.rollback();
      console.error("Error:", error);
      res.status(500).json({ message: "Error adding product", error });
  }
};



// const editProduct = async (req, res) => {
//   const { Prod_Id } = req.params; // Product ID from the URL
//   const updatedProductDetails = req.body;
//   const featuredImage = req.files?.Featured_Img?.[0]?.filename || null;
//   const multipleImages = req.files?.multipleImages?.map((file) => file.filename) || [];

//   let pool;
//   let transaction;

//   try {
//     pool = await sql.connect(dbConfig);
//     transaction = new sql.Transaction(pool);

//     // Begin transaction
//     await transaction.begin();

//     // Fetch current featured image
//     const currentImageResult = await pool
//       .request()
//       .input('Prod_Id', sql.Int, Prod_Id)
//       .query(`
//         SELECT [Featured_Img]
//         FROM [masysecommerce].[masysecommerce].[Product]
//         WHERE [Prod_Id] = @Prod_Id
//       `);

//     const currentImage = currentImageResult.recordset[0]?.Featured_Img;

//     // If a new featured image is uploaded, delete the old image
//     if (featuredImage && currentImage) {
//       deleteImage(currentImage, 'Product');
//     }

//     // Fetch existing multiple images
//     const currentMultipleImagesResult = await pool
//       .request()
//       .input('Prod_Id', sql.Int, Prod_Id)
//       .query(`
//         SELECT [Image_Name]
//         FROM [masysecommerce].[masysecommerce].[Product_Multiple_Img]
//         WHERE [Prod_Id] = @Prod_Id
//       `);

//     const currentMultipleImages = currentMultipleImagesResult.recordset.map((record) => record.Image_Name);

//     // If new multiple images are uploaded, delete old images
//     if (multipleImages.length > 0) {
//       currentMultipleImages.forEach((image) => deleteImage(image, 'Product_Multiple_Images'));

//       // Clear existing entries in the database for this product's images
//       await pool
//         .request()
//         .input('Prod_Id', sql.Int, Prod_Id)
//         .query(`
//           DELETE FROM [masysecommerce].[masysecommerce].[Product_Multiple_Img]
//           WHERE [Prod_Id] = @Prod_Id
//         `);
//     }

//     // Update product details
//     const updateProductQuery = `
//       UPDATE [masysecommerce].[masysecommerce].[Product]
//       SET 
//         [Prod_Code] = @Prod_Code,
//         [Cat_Id] = @Cat_Id,
//         [Cat_Name] = @Cat_Name,
//         [Sub_Cat_Id] = @Sub_Cat_Id,
//         [Sub_at_Name] = @Sub_at_Name,
//         [Prod_Name] = @Prod_Name,
//         [HSN_Code] = @HSN_Code,
//         [Featured_Img] = COALESCE(@Featured_Img, [Featured_Img]),
//         [Img_360] = @Img_360,
//         [Short_Description] = @Short_Description,
//         [VideoLink] = @VideoLink,
//         [Brand_Name] = @Brand_Name,
//         [Manufacturer_Name] = @Manufacturer_Name,
//         [Avg_Rating] = @Avg_Rating,
//         [Prod_Description] = @Prod_Description,
//         [Param1] = @Param1,
//         [Param1_Val] = @Param1_Val,
//         [Param2] = @Param2,
//         [Param2_Val] = @Param2_Val,
//         [Param3] = @Param3,
//         [Param3_Val] = @Param3_Val,
//         [Purchase_Price] = @Purchase_Price,
//         [MRP] = @MRP,
//         [Web_Price] = @Web_Price,
//         [Store_Price] = @Store_Price,
//         [InStock] = @InStock,
//         [Is_Variant] = @Is_Variant,
//         [GST_Applicable] = @GST_Applicable,
//         [GST_Category] = @GST_Category,
//         [GST_Rate] = @GST_Rate,
//         [Unit_id] = @Unit_id,
//         [UnitOfMeasurement] = @UnitOfMeasurement,
//         [Added_On] = GETDATE(),
//         [Added_By] = @Added_By,
//         [Qty] = @Qty,
//         [SEOTitle] = @SEOTitle,
//         [SEODes] = @SEODes,
//         [SEOKeyword] = @SEOKeyword
//       WHERE [Prod_Id] = @Prod_Id`;

//     const productRequest = new sql.Request(transaction);
//     productRequest.input("Prod_Id", sql.Int, Prod_Id);
//     productRequest.input("Prod_Code", sql.VarChar, updatedProductDetails.Prod_Code);
//     productRequest.input("Cat_Id", sql.Int, updatedProductDetails.Cat_Id);
//     productRequest.input("Cat_Name", sql.VarChar, updatedProductDetails.Cat_Name);
//     productRequest.input("Sub_Cat_Id", sql.Int, updatedProductDetails.Sub_Cat_Id);
//     productRequest.input("Sub_at_Name", sql.VarChar, updatedProductDetails.Sub_at_Name);
//     productRequest.input("Prod_Name", sql.VarChar, updatedProductDetails.Prod_Name);
//     productRequest.input("HSN_Code", sql.VarChar, updatedProductDetails.HSN_Code);
//     productRequest.input("Featured_Img", sql.VarChar, featuredImage);
//     productRequest.input("Img_360", sql.VarChar, updatedProductDetails.Img_360);
//     productRequest.input("Short_Description", sql.VarChar, updatedProductDetails.Short_Description);
//     productRequest.input("VideoLink", sql.VarChar, updatedProductDetails.VideoLink);
//     productRequest.input("Brand_Name", sql.VarChar, updatedProductDetails.Brand_Name);
//     productRequest.input("Manufacturer_Name", sql.VarChar, updatedProductDetails.Manufacturer_Name);
//     productRequest.input("Avg_Rating", sql.Decimal(18, 2), updatedProductDetails.Avg_Rating);
//     productRequest.input("Prod_Description", sql.VarChar, updatedProductDetails.Prod_Description);
//     productRequest.input("Param1", sql.VarChar, updatedProductDetails.Param1);
//     productRequest.input("Param1_Val", sql.VarChar, updatedProductDetails.Param1_Val);
//     productRequest.input("Param2", sql.VarChar, updatedProductDetails.Param2);
//     productRequest.input("Param2_Val", sql.VarChar, updatedProductDetails.Param2_Val);
//     productRequest.input("Param3", sql.VarChar, updatedProductDetails.Param3);
//     productRequest.input("Param3_Val", sql.VarChar, updatedProductDetails.Param3_Val);
//     productRequest.input("Purchase_Price", sql.Decimal(18, 2), updatedProductDetails.Purchase_Price);
//     productRequest.input("MRP", sql.Decimal(18, 2), updatedProductDetails.MRP);
//     productRequest.input("Web_Price", sql.Decimal(18, 2), updatedProductDetails.Web_Price);
//     productRequest.input("Store_Price", sql.Decimal(18, 2), updatedProductDetails.Store_Price);
//     productRequest.input("InStock", sql.VarChar, updatedProductDetails.InStock);
//     productRequest.input("Is_Variant", sql.VarChar, updatedProductDetails.Is_Variant);
//     productRequest.input("GST_Applicable", sql.VarChar, updatedProductDetails.GST_Applicable);
//     productRequest.input("GST_Category", sql.VarChar, updatedProductDetails.GST_Category);
//     productRequest.input("GST_Rate", sql.Decimal(18, 2), updatedProductDetails.GST_Rate);
//     productRequest.input("Unit_id", sql.Int, updatedProductDetails.Unit_id);
//     productRequest.input("UnitOfMeasurement", sql.VarChar, updatedProductDetails.UnitOfMeasurement);
//     productRequest.input("Added_By", sql.VarChar, updatedProductDetails.Added_By);
//     productRequest.input("Qty", sql.VarChar, updatedProductDetails.Qty);
//     productRequest.input("SEOTitle", sql.VarChar, updatedProductDetails.SEOTitle);
//     productRequest.input("SEODes", sql.VarChar, updatedProductDetails.SEODes);
//     productRequest.input("SEOKeyword", sql.VarChar, updatedProductDetails.SEOKeyword);

//     await productRequest.query(updateProductQuery);

//     // Insert new multiple images if provided
//     if (multipleImages.length > 0) {
//       const insertMultipleImagesQuery = `
//         INSERT INTO [masysecommerce].[masysecommerce].[Product_Multiple_Img]
//           ([Prod_Id], [Image_Name], [Added_On], [Added_By], [Status],[Org_Id]
//       ,[Admin_Id]
//       ,[Branch_Id])
//         VALUES
//           (@Prod_Id, @Image_Name, GETDATE(), @Added_By, @Status,@Org_Id,@Admin_Id,@Branch_Id)`;

//       for (const image of multipleImages) {
//         const imageRequest = new sql.Request(transaction);
//         imageRequest.input("Prod_Id", sql.Int, Prod_Id);
//         imageRequest.input("Org_Id", sql.Int, updatedProductDetails.Org_Id);
//         imageRequest.input("Admin_Id", sql.Int, updatedProductDetails.Admin_Id);
//         imageRequest.input("Branch_Id", sql.VarChar, updatedProductDetails.Branch_Id);
//         imageRequest.input("Image_Name", sql.VarChar, image);
//         imageRequest.input("Added_By", sql.VarChar, updatedProductDetails.Added_By);
//         imageRequest.input("Status", sql.Int, 1); // Assuming status is 1 (active)
//         await imageRequest.query(insertMultipleImagesQuery);
//       }
//     }

//     // Commit transaction
//     await transaction.commit();
//     res.status(200).json({ message: "Product updated successfully." });
//   } catch (error) {
//     // Rollback transaction in case of error
//     if (transaction) await transaction.rollback();
//     console.error("Error editing product:", error);
//     res.status(500).json({ error: "Failed to edit product." });
//   } finally {
//     if (pool) await pool.close();
//   }
// };

const editProduct = async (req, res) => {
  const { Prod_Id } = req.params; // Product ID from the URL
  const updatedProductDetails = req.body;
  const featuredImage = req.files?.Featured_Img?.[0]?.filename || null;
  const multipleImages = req.files?.multipleImages?.map((file) => file.filename) || [];

  // console.log(updatedProductDetails);
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Fetch current featured image
    // console.log(`Fetching current featured image for Prod_Id: ${Prod_Id}`);
    const [currentImageResult] = await connection.execute(
      "SELECT Featured_Img FROM Product WHERE Prod_Id = ?", [Prod_Id]
    );

    const currentImage = currentImageResult[0]?.Featured_Img;
    if (featuredImage && currentImage) {
      // console.log(`New featured image uploaded, deleting old image: ${currentImage}`);
      deleteImage(currentImage, 'product');
    }

    // Fetch existing multiple images
    // console.log(`Fetching existing multiple images for Prod_Id: ${Prod_Id}`);
    const [currentMultipleImagesResult] = await connection.execute(
      "SELECT Image_Name FROM Product_Multiple_Img WHERE Prod_Id = ?", [Prod_Id]
    );

    const currentMultipleImages = currentMultipleImagesResult.map(record => record.Image_Name);
    if (multipleImages.length > 0) {
      // console.log(`New multiple images uploaded, deleting old images...`);
      currentMultipleImages.forEach(image => {
        // console.log(`Deleting old multiple image: ${image}`);
        deleteImage(image, 'ProductMultipleImage');
      });

      // console.log(`Clearing existing entries in Product_Multiple_Img for Prod_Id: ${Prod_Id}`);
      await connection.execute("DELETE FROM Product_Multiple_Img WHERE Prod_Id = ?", [Prod_Id]);
    }

    // Update product details
    // console.log(`Updating product details for Prod_Id: ${Prod_Id}`);
    const updateProductQuery = `
      UPDATE Product SET 
        Prod_Code = ?, Cat_Id = ?, Cat_Name = ?, Sub_Cat_Id = ?, Sub_at_Name = ?, Prod_Name = ?, HSN_Code = ?,
        Featured_Img = COALESCE(?, Featured_Img), Img_360 = ?, Short_Description = ?, VideoLink = ?, Brand_Name = ?,
        Manufacturer_Name = ?, Avg_Rating = ?, Prod_Description = ?, Param1 = ?, Param1_Val = ?, Param2 = ?, Param2_Val = ?,
        Param3 = ?, Param3_Val = ?, Purchase_Price = ?, MRP = ?, Web_Price = ?, Store_Price = ?, InStock = ?,
        Is_Variant = ?, GST_Applicable = ?, GST_Category = ?, GST_Rate = ?, Unit_id = ?, UnitOfMeasurement = ?,
        Added_On = NOW(), Added_By = ?, Qty = ?, SEOTitle = ?, SEODes = ?, SEOKeyword = ?
      WHERE Prod_Id = ?`;

    await connection.execute(updateProductQuery, [
      updatedProductDetails.Prod_Code, updatedProductDetails.Cat_Id, updatedProductDetails.Cat_Name,
      updatedProductDetails.Sub_Cat_Id || null, updatedProductDetails.Sub_at_Name || null, updatedProductDetails.Prod_Name,
      updatedProductDetails.HSN_Code, featuredImage, updatedProductDetails.Img_360,
      updatedProductDetails.Short_Description, updatedProductDetails.VideoLink, updatedProductDetails.Brand_Name,
      updatedProductDetails.Manufacturer_Name, updatedProductDetails.Avg_Rating, updatedProductDetails.Prod_Description,
      updatedProductDetails.Param1, updatedProductDetails.Param1_Val, updatedProductDetails.Param2,
      updatedProductDetails.Param2_Val, updatedProductDetails.Param3, updatedProductDetails.Param3_Val,
      updatedProductDetails.Purchase_Price, updatedProductDetails.MRP, updatedProductDetails.Web_Price,
      updatedProductDetails.Store_Price, updatedProductDetails.InStock, updatedProductDetails.Is_Variant,
      updatedProductDetails.GST_Applicable, updatedProductDetails.GST_Category, updatedProductDetails.GST_Rate,
      updatedProductDetails.Unit_id, updatedProductDetails.UnitOfMeasurement, updatedProductDetails.Added_By,
      updatedProductDetails.quantity1, updatedProductDetails.SEOTitle, updatedProductDetails.SEODes,
      updatedProductDetails.SEOKeyword, Prod_Id
    ]);

    // Insert new multiple images if provided
    if (multipleImages.length > 0) {
      // console.log(`Inserting new multiple images for Prod_Id: ${Prod_Id}`);
      const insertMultipleImagesQuery = `
        INSERT INTO Product_Multiple_Img (Prod_Id, Image_Name, Added_On, Added_By, Status, Org_Id, Admin_Id, Branch_Id)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`;

      for (const image of multipleImages) {
        await connection.execute(insertMultipleImagesQuery, [
          Prod_Id, image, updatedProductDetails.Added_By, 1,
          updatedProductDetails.Org_Id, updatedProductDetails.Admin_Id, updatedProductDetails.Branch_Id
        ]);
      }
    }

    // Commit transaction
    // console.log("Committing transaction...");
    await connection.commit();
    res.status(200).json({ message: "Product updated successfully." });
  } catch (error) {
    // Rollback transaction in case of error
    if (connection) await connection.rollback();
    console.error("Error editing product:", error);
    res.status(500).json({ error: "Failed to edit product." });
  } finally {
    if (connection) await connection.end();
  }
};




const editProductVariants = async (req, res) => {
  const { Var_Id } = req.params;

  const {
    Org_Id,
    VarientType,
    UnitOfMeasurement,
    Branch_Id,
    Admin_Id,
    Added_By,
    Product_Name,
    Barcode,
    Purchase_Price,
    MRP,
    Web_Price,
    Store_Price,
    Stock,
    Qty,
    Variant1_Id,
    Variant_Name1,
    Value1_Id,
    Variant_Value1,
    Variant2_Id,
    Variant_Name2,
    Value2_Id,
    Variant_Value2,
    Status,
  } = req.body;

  const imagesName = req.files?.Image_Name?.map((file) => file.filename) || [];
  const featuredImages = req.files?.Featured_Image?.map((file) => file.filename) || [];

  try {
    if (!Var_Id) {
      return res.status(400).json({ error: "Var_Id is required." });
    }

    const connection = await mysql.createConnection(dbConfig);

    if (featuredImages.length > 0) {
      const [existingImageResult] = await connection.execute(
        "SELECT Featured_Image FROM Product_Variants_new WHERE Var_Id = ?",
        [Var_Id]
      );

      if (existingImageResult.length > 0) {
        const existingFeaturedImage = existingImageResult[0].Featured_Image;
        if (existingFeaturedImage) {
          await deleteImage(existingFeaturedImage, "product");
        }
      }
    }

    const updateVariantsQuery = `
      UPDATE Product_Variants_new SET
        Org_Id = ?,
        Product_Name = ?,
        Barcode = ?,
        Purchase_Price = ?,
        MRP = ?,
        Web_Price = ?,
        Store_Price = ?,
        Stock = ?,
        Featured_Image = COALESCE(?, Featured_Image),
        Added_By = ?,
        VarientType = ?,
        Status = ?,
        Qty = ?,
        UnitOfMeasurement = ?,
        Variant1_Id = ?,
        Variant_Name1 = ?,
        Value1_Id = ?,
        Variant_Value1 = ?,
        Variant2_Id = ?,
        Variant_Name2 = ?,
        Value2_Id = ?,
        Variant_Value2 = ?,
        Updated_On = NOW()
      WHERE Var_Id = ?
    `;

    const [variantsResult] = await connection.execute(updateVariantsQuery, [
      Org_Id,
      Product_Name,
      Barcode || null,
      Purchase_Price,
      MRP,
      Web_Price,
      Store_Price,
      Stock,
      featuredImages[0] || null,
      Added_By,
      VarientType,
      1,
      Qty,
      UnitOfMeasurement,
      Variant1_Id || null,
      Variant_Name1 || null,
      Value1_Id || null,
      Variant_Value1 || null,
      Variant2_Id || null,
      Variant_Name2 || null,
      Value2_Id || null,
      Variant_Value2 || null,
      Var_Id,
    ]);

    if (variantsResult.affectedRows === 0) {
      return res.status(404).json({ error: "Variant not found in Product_Variants_new." });
    }

    if (imagesName.length > 0) {
      const [existingImagesResult] = await connection.execute(
        "SELECT Image_Name FROM Varient_Multiple_Img WHERE Var_Id = ?",
        [Var_Id]
      );

      const existingImages = existingImagesResult.map((row) => row.Image_Name);

      for (const image of existingImages) {
        await deleteImage(image, "VariantMultipleImage");
      }

      await connection.execute(
        "DELETE FROM Varient_Multiple_Img WHERE Var_Id = ?",
        [Var_Id]
      );

      const insertImageQuery = `
        INSERT INTO Varient_Multiple_Img 
        (Var_Id, Org_Id, Admin_Id, Branch_Id, Image_Name, Added_On, Added_By, Status)
        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
      `;

      for (const imageName of imagesName) {
        await connection.execute(insertImageQuery, [
          Var_Id,
          Org_Id,
          Admin_Id,
          Branch_Id,
          imageName,
          Added_By,
          1,
        ]);
      }
    }

    res.status(200).json({ message: "Product variant and associated images updated successfully." });
  } catch (error) {
    console.error("Error updating product variant and images:", error);
    res.status(500).json({ error: "An error occurred while updating the product variant and images." });
  }
};









const viewProducts = async (req, res) => {
  try {
    const { Org_Id } = req.params;
    const { Cat_Id, Sub_Cat_Id } = req.query;

    if (!Org_Id) {
      return res.status(400).json({ message: 'Org_Id is required' });
    }

    const connection = await mysql.createConnection(dbConfig);

    let query = `
        SELECT * FROM Product WHERE Org_Id = ?
    `;
    const params = [Org_Id];

    if (Cat_Id) {
      query += ' AND Cat_Id = ?';
      params.push(Cat_Id);
    }
    if (Sub_Cat_Id) {
      query += ' AND Sub_Cat_Id = ?';
      params.push(Sub_Cat_Id);
    }

    const [rows] = await connection.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No products found for the given filters' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

const viewProductVariants = async (req, res) => {
  const { Product_Id } = req.params;
  const { Org_Id } = req.query;

  if (!Product_Id) {
    return res.status(400).json({ message: 'Product_Id is required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM Product_Variants_new WHERE Product_Id = ? AND Org_Id = ?`;
    const [rows] = await connection.execute(query, [Product_Id, Org_Id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No product variants found' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const viewVariantTypesForProducts = async (req, res) => {
  const { Org_Id } = req.params;
  if (!Org_Id) {
    return res.status(400).json({ message: 'Org_Id is required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM VariantType WHERE Org_Id = ?`;
    const [rows] = await connection.execute(query, [Org_Id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No variants found' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const viewVariantValuesForProduct = async (req, res) => {
  const { Org_Id, VariantTypeId } = req.params;
  if (!Org_Id || !VariantTypeId) {
    return res.status(400).json({ message: 'Org_Id and VariantTypeId are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM VariantValue WHERE Org_Id = ? AND VariantTypeId = ?`;
    const [rows] = await connection.execute(query, [Org_Id, VariantTypeId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No variant values found' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching variant values:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};










const addVariantValue = async (req, res) => {
  const { VariantTypeId, VariantTypeName, VariantValue, AddedBy, BranchId = 'All', Org_Id, Admin_Id } = req.body;

  if (!VariantTypeId || !VariantValue || !Org_Id || !Admin_Id || !VariantTypeName || !AddedBy) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO VariantValue 
      (Org_Id, Admin_Id, Branch_Id, VariantTypeName, VariantTypeId, VariantValue, AddedOn, AddedBy)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?);`,
      [Org_Id, Admin_Id, BranchId, VariantTypeName, VariantTypeId, VariantValue, AddedBy]
    );
    res.status(201).json({ message: "Variant Value added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const viewProductsByProductId = async (req, res) => {
  const { Prod_Id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [productResult] = await connection.execute(
      `SELECT * FROM Product WHERE Prod_Id = ?`,
      [Prod_Id]
    );
    const [variantsResult] = await connection.execute(
      `SELECT * FROM Product_Variants_new WHERE Product_Id = ?`,
      [Prod_Id]
    );
    if (productResult.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ product: productResult[0], variants: variantsResult });
  } catch (error) {
    console.error("Error fetching product and variants:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addProductVariants = async (req, res) => {
  const { Prod_Id } = req.params;
  const { VarientType, UnitOfMeasurement, Branch_Id, Admin_Id, Org_Id, Added_By, variants } = req.body;
  const image_name = req.files;
  // console.log(image_name);
  try {
    const parsedVariants = JSON.parse(variants);
    // console.log("Variants", parsedVariants);
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO Product_Variants_new (Product_Id, VarientType, UnitOfMeasurement, Org_Id, Added_By, Variant1_Id, Variant_Name1, Value1_Id, Variant_Value1, Variant2_Id, Variant_Name2, Value2_Id, Variant_Value2, Barcode, Purchase_Price, MRP, Web_Price, Store_Price, Stock, Qty, Product_Name, Featured_Image, Added_On)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [Prod_Id, VarientType, UnitOfMeasurement, Org_Id, Added_By, parsedVariants.Variant1_Id, parsedVariants.Variant_Name1, parsedVariants.Value1_Id, parsedVariants.Variant_Value1, parsedVariants.Variant2_Id, parsedVariants.Variant_Name2, parsedVariants.Value2_Id, parsedVariants.Variant_Value2, parsedVariants.Barcode, parsedVariants.Purchase_Price, parsedVariants.MRP, parsedVariants.Web_Price, parsedVariants.Store_Price, parsedVariants.Stock, parsedVariants.Qty, parsedVariants.Product_Name, parsedVariants.Featured_Image]
    );
    const Var_Id = result.insertId;
    for (const imageName of parsedVariants.Image_Name) {
      await connection.execute(
        `INSERT INTO Varient_Multiple_Img (Org_Id, Admin_Id, Branch_Id, Var_Id, Image_Name, Added_On, Added_By, Status)
        VALUES (?, ?, ?, ?, ?, NOW(), ?, 1)`,
        [Org_Id, Admin_Id, Branch_Id, Var_Id, imageName, Added_By]
      );
    }
    res.status(201).json({ message: 'Variant and images added successfully', Var_Id });
  } catch (error) {
    console.error('Error adding product variant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const deleteProduct = async (req, res) => {
  const { Prod_Id } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    try {
      const [featuredImgResult] = await connection.execute(
        `SELECT Featured_Img FROM Product WHERE Prod_Id = ?`,
        [Prod_Id]
      );
      if (featuredImgResult.length > 0) {
        deleteImage(featuredImgResult[0].Featured_Img, "product");
      }

      const [variants] = await connection.execute(
        `SELECT Var_Id, Featured_Image FROM Product_Variants_new WHERE Product_Id = ?`,
        [Prod_Id]
      );
      
      for (const variant of variants) {
        if (variant.Featured_Image) {
          deleteImage(variant.Featured_Image, "product");
        }
      }

      const varIds = variants.map((variant) => variant.Var_Id);
      if (varIds.length > 0) {
        const [variantImagesResult] = await connection.execute(
          `SELECT Image_Name FROM Varient_Multiple_Img WHERE Var_Id IN (${varIds.join(',')})`
        );
        variantImagesResult.forEach(row => deleteImage(row.Image_Name, "VariantMultipleImage"));

        await connection.execute(
          `DELETE FROM Varient_Multiple_Img WHERE Var_Id IN (${varIds.join(',')})`
        );
      }

      const [productImagesResult] = await connection.execute(
        `SELECT Image_Name FROM Product_Multiple_Img WHERE Prod_Id = ?`,
        [Prod_Id]
      );
      productImagesResult.forEach(row => deleteImage(row.Image_Name, "ProductMultipleImage"));

      await connection.execute(`DELETE FROM Product_Multiple_Img WHERE Prod_Id = ?`, [Prod_Id]);
      await connection.execute(`DELETE FROM Product_Variants_new WHERE Product_Id = ?`, [Prod_Id]);
      await connection.execute(`DELETE FROM Product WHERE Prod_Id = ?`, [Prod_Id]);

      await connection.commit();
      res.status(200).json({ message: 'Product and related images deleted successfully' });
    } catch (innerError) {
      await connection.rollback();
      console.error('Error during deletion:', innerError);
      res.status(500).json({ error: 'Internal server error during deletion' });
    }
  } catch (error) {
    console.error('Database connection failed:', error.message);
    res.status(500).json({ error: 'Failed to connect to the database' });
  }
};

const deleteProductVariant = async (req, res) => {
  const { Var_Id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [variantQuery] = await connection.execute(
      'SELECT Featured_Image FROM Product_Variants_new WHERE Var_Id = ?',
      [Var_Id]
    );

    if (variantQuery.length === 0) {
      return res.status(404).json({ message: 'Variant not found in Product_Variants_new' });
    }

    const { Featured_Image } = variantQuery[0];

    const [multipleImgQuery] = await connection.execute(
      'SELECT Image_Name FROM Varient_Multiple_Img WHERE Var_Id = ?',
      [Var_Id]
    );

    multipleImgQuery.forEach(row => deleteImage(row.Image_Name, 'VariantMultipleImage'));

    if (Featured_Image) {
      deleteImage(Featured_Image, 'product');
    }

    await connection.execute('DELETE FROM Varient_Multiple_Img WHERE Var_Id = ?', [Var_Id]);
    await connection.execute('DELETE FROM Product_Variants_new WHERE Var_Id = ?', [Var_Id]);

    return res.status(200).json({ message: 'Product variant and images deleted successfully' });
  } catch (error) {
    console.error('Error deleting product variant:', error);
    return res.status(500).json({ message: 'Error deleting product variant', error: error.message });
  }
};









module.exports = {
  viewProducts,editProduct, viewProductVariants, viewVariantTypesForProducts, viewVariantValuesForProduct, addVariantValue,addProducts,viewProductsByProductId,editProductVariants,addProductVariants,deleteProduct,deleteProductVariant
};
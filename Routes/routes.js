// routes.js
const express = require("express");
const  {uploadImages,  uploadCategories, uploadSubCategories, uploadVariants}  = require("../Config/multerConfig")
const router = express.Router();
const {getWelcomeMessage, getData, getUsers} = require('../Controllers/testController')
const { login, logout } = require("../Controllers/authController");
const { verifyUser, getDashboard } = require("../Middlewares/authMiddleware");
const { addCategories,viewCategories,editCategories,deleteCategories, viewAllCategories} = require("../Controllers/categoryController");
const {addSubCategories,viewSubCategories,editSubCategories,deleteSubCategories} = require('../Controllers/subcategoryController');
const { viewProducts,viewProductVariants, viewVariantTypesForProducts, viewVariantValuesForProduct, addProducts, addVariantValue, viewProductsByProductId, editProduct, editProductVariants, addProductVariants, deleteProduct, deleteProductVariant } = require("../Controllers/productController");
const { addVariantTypes, viewVariantTypes, deleteVariantTypes } = require("../Controllers/variantController");


// TestController.js
router.get("/", getWelcomeMessage);
router.get("/data", getData);
router.get('/users', getUsers)

//authController.js
router.post("/login", login);
router.get('/logout',logout);

//authMiddleware.js
router.get("/dashboard",verifyUser,getDashboard);

//categoryController.js
router.get("/viewAllCategories/:Org_Id",viewAllCategories)
router.get("/viewCategories/:Org_Id", viewCategories);
router.post('/addCategories',uploadCategories.single('Cat_Img'),addCategories)
router.put('/editCategories/:Cat_Id',uploadCategories.single('Cat_Img'),editCategories)
router.delete("/deleteCategories/:Cat_Id", deleteCategories);

//subcatergoryController.js
router.post('/addSubCategories',uploadSubCategories.single('Cat_Img'),addSubCategories)
router.get('/viewSubCategories', viewSubCategories);
router.put('/editSubCategories/:Cat_Id',uploadSubCategories.single('Cat_Img'),editSubCategories)
router.delete("/deleteSubCategories/:Id", deleteSubCategories);

//productController.js
router.post('/addProducts',
  uploadImages.fields([
    { name: 'Featured_Img' },
    { name: 'multipleImages' },
    { name: 'Image_Name' },
    { name: 'Featured_Image' }
  ]),
  addProducts);
router.put('/editProduct/:Prod_Id', uploadImages.fields([
  { name: 'Featured_Img' },
  { name: 'multipleImages' }
]),editProduct)
router.put('/EditVariant/:Var_Id',uploadVariants.fields([
  {name: "Featured_Image"},
  {name: "Image_Name"},
]),editProductVariants)
router.post('/addProductVariants/:Prod_Id',uploadVariants.fields([
  {name:"Featured_Image"},
  {name:"Image_Name"}
]),addProductVariants)
router.delete('/deleteProductVariant/:Var_Id',deleteProductVariant)
router.delete("/deleteProduct/:Prod_Id",deleteProduct)
router.get("/viewProducts/:Org_Id",viewProducts)
router.get("/viewProductsByProductId/:Prod_Id",viewProductsByProductId)
router.get('/viewVariants/:Product_Id', viewProductVariants);
router.get('/viewVariantTypesForProducts/:Org_Id',viewVariantTypesForProducts)
router.post('/addVariantValue',addVariantValue)
router.get('/viewVariantValuesForProducts/:Org_Id/:VariantTypeId',viewVariantValuesForProduct)

//variantController.js
router.post("/addVariantTypes", addVariantTypes);
router.get("/viewVariantTypes/:Org_Id",viewVariantTypes);
router.delete("/deleteVariantTypes/:Sr_No",deleteVariantTypes);




module.exports = router;


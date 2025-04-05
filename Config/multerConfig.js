const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper function to delete image from a specific folder
const deleteImage = (imageName, folderName) => {
  if (!imageName || !folderName) {
    return; // Skip deletion if either argument is missing
  }

  const imagePath = path.join(__dirname, "../public", "Images", folderName, imageName);

  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath); // Delete the image file
    console.log(`Image ${imageName} deleted from ${folderName} folder.`);
  } else {
    console.error(`Image ${imageName} not found in ${folderName} folder.`);
  }
};

// const storageImages = multer.diskStorage({
//   destination: function (req, file, cb) {
//     try {
//       const productDirectory = path.join(__dirname, "../public/Images/Product_Multiple_Images");
//       const variantDirectory = path.join(__dirname, "../public/Images/VariantMultipleImages");
//       const featuredDirectory = path.join(__dirname, "../public/Images/Product");

//       // Log the file details before insertion
//       console.log(`Uploading file: ${file.originalname}`);
//       console.log(`Field Name: ${file.fieldname}`);
//       console.log(`File Size: ${file.size} bytes`);

//       // Decide destination based on the request
//       if (req.body.Is_Variant === "1") {
//         // For variants
//         if (file.fieldname === "Image_Name") {
//           console.log(`Storing in VariantMultipleImages folder`);
//           cb(null, variantDirectory); // Store in VariantMultipleImages
//         } else if (file.fieldname === "Featured_Image" || file.fieldname === "Featured_Img") {
//           console.log(`Storing in Product folder for Featured Image`);
//           cb(null, featuredDirectory); // Store in Product for Featured_Image or Featured_Img
//         } else if (file.fieldname === "multipleImages") {
//           console.log(`Storing in Product_Multiple_Images folder`);
//           cb(null, productDirectory); // Store in Product_Multiple_Images
//         } else {
//           console.warn(`Invalid fieldname for Is_Variant = 1: '${file.fieldname}'`);
//           cb(new Error(`Invalid fieldname '${file.fieldname}' for Is_Variant = 1`), null);
//         }
//       } else {
//         // For non-variants
//         if (file.fieldname === "multipleImages") {
//           console.log(`Storing in Product_Multiple_Images folder`);
//           cb(null, productDirectory); // Store in Product_Multiple_Images
//         } else if (file.fieldname === "Featured_Img") {
//           console.log(`Storing in Product folder for Featured Image`);
//           cb(null, featuredDirectory); // Store in Product
//         } else {
//           console.warn(`Invalid fieldname for Is_Variant != 1: '${file.fieldname}'`);
//           cb(new Error(`Invalid fieldname '${file.fieldname}' for Is_Variant != 1`), null);
//         }
//       }
//     } catch (error) {
//       console.error("Error in destination handler:", error);
//       cb(new Error("Error while setting up destination"), null);
//     }
//   },

//   filename: function (req, file, cb) {
//     // Generate a unique filename using the current timestamp and a random string
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const fileName = file.fieldname + "_" + uniqueSuffix + path.extname(file.originalname);

//     // Log the file details after insertion (when filename is set)
//     console.log(`File inserted: ${fileName}`);
//     console.log(`Final Destination Path: ${path.join(__dirname, "../public/Images/")}`);

//     cb(null, fileName);  // Store the file with the unique name
//   }
// });

const storageImages = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const productDirectory = path.join(__dirname, "../public/Images/ProductMultipleImage");
      const variantDirectory = path.join(__dirname, "../public/Images/VariantMultipleImage");
      const featuredDirectory = path.join(__dirname, "../public/Images/product");

  

      // Decide destination based on the request
      if (req.body.Is_Variant === "1") {
        if (file.fieldname === "Image_Name") {
          cb(null, variantDirectory); // Store in VariantMultipleImages
        } else if (file.fieldname === "Featured_Image" || file.fieldname === "Featured_Img") {
          cb(null, featuredDirectory); // Store in Product for Featured_Image or Featured_Img
        } else if (file.fieldname === "multipleImages") {
          cb(null, productDirectory); // Store in Product_Multiple_Images
        } else {
          console.warn(`Invalid fieldname for Is_Variant = 1: '${file.fieldname}'`);
          cb(new Error(`Invalid fieldname '${file.fieldname}' for Is_Variant = 1`), null);
        }
      } else {
        if (file.fieldname === "multipleImages") {
          cb(null, productDirectory); // Store in Product_Multiple_Images
        } else if (file.fieldname === "Featured_Img") {
          cb(null, featuredDirectory); // Store in Product
        } else {
          console.warn(`Invalid fieldname for Is_Variant != 1: '${file.fieldname}'`);
          cb(new Error(`Invalid fieldname '${file.fieldname}' for Is_Variant != 1`), null);
        }
      }
    } catch (error) {
      console.error("Error in destination handler:", error);
      cb(new Error("Error while setting up destination"), null);
    }
  },
  filename: function (req, file, cb) {
    // Check the fieldname to decide whether to rename the file
    if (file.fieldname === "Featured_Image") {
      // Rename only for "Featured_Image"
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop(); // Extract the file extension
      const uniqueName = `FeaturedImg_${timestamp}.${extension}`; // Generate a unique name
      cb(null, uniqueName);
    } else {
      // Use the original file name for other fields
      cb(null, file.originalname);
    }
  }

});


const storageImagesForVariants = multer.diskStorage({
  destination: function (req, file, cb) {
    let directory;

    // Check the fieldname and set the directory accordingly
    if (file.fieldname === "Featured_Image") {
      directory = path.join(__dirname, "../public", "Images/product");
    } else if (file.fieldname === "Image_Name") {
      directory = path.join(
        __dirname,
        "../public",
        "Images/VariantMultipleImages"
      );
    } else {
      return cb(new Error("Invalid fieldname for uploading files"), null);
    }

    // Create the directory if it doesn't exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    cb(null, directory);
  },

  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueName =
      file.fieldname + "_" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});






const storageImagesForBlogs = multer.diskStorage({
  destination: function (req, file, cb) {
   
   
    if (file.fieldname === "blogImages" || file.fieldname === "insideImages") {
      // Base directory for blog images
      let directory = path.join(__dirname, "../public", "Images/blogs");
    
      // If the field is "insideImages", create a single "insideImages" subdirectory
      if (file.fieldname === "insideImages") {
        // Create the directory for insideImages
        let insideImageDir = path.join(directory, "insideImages");
    
        // Create the directory if it doesn't exist
        if (!fs.existsSync(insideImageDir)) {
          fs.mkdirSync(insideImageDir, { recursive: true });
        }
    
        // Set the destination directory for each image
        cb(null, insideImageDir);
      } else {
        // Handle the case for blogImages
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        cb(null, directory);
      }
    } else {
      // Handle cases where fieldname is not "multipleImages"
      return cb(new Error("Invalid fieldname for uploading files"), null);
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});


const storageImagesForBannerAndPromo = multer.diskStorage({
  destination: function (req, file, cb) {
   
   
    if (file.fieldname === "bannerImage") {
      const directory = path.join(__dirname, "../public", "Images/BannerAndPromo");

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      cb(null, directory);
    }
else {
      // Handle cases where fieldname is not "multipleImages"
      return cb(new Error("Invalid fieldname for uploading files"), null);
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});


const storageImagesForCategories = multer.diskStorage({
  destination: function (req, file, cb) {
   
   
    if (file.fieldname === "Cat_Img") {
      const directory = path.join(__dirname, "../public", "Images/categories");

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      cb(null, directory);
    }
else {
      // Handle cases where fieldname is not "multipleImages"
      return cb(new Error("Invalid fieldname for uploading files"), null);
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});


const storageImagesForCoupons = multer.diskStorage({
  destination: function (req, file, cb) {
   
   
    if (file.fieldname === "CouponImage") {
      const directory = path.join(__dirname, "../public", "Images/CouponImage");

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      cb(null, directory);
    }
else {
      // Handle cases where fieldname is not "multipleImages"
      return cb(new Error("Invalid fieldname for uploading files"), null);
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const storageImagesForSubCategories = multer.diskStorage({
  destination: function (req, file, cb) {
   
   
    if (file.fieldname === "Cat_Img") {
      const directory = path.join(__dirname, "../public", "Images/Sub-Category");

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      cb(null, directory);
    }
else {
      // Handle cases where fieldname is not "multipleImages"
      return cb(new Error("Invalid fieldname for uploading files"), null);
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadVariants = multer ({storage: storageImagesForVariants})
const uploadSubCategories = multer ({storage: storageImagesForSubCategories})
const uploadCoupons = multer ({storage: storageImagesForCoupons})
const uploadCategories = multer ({storage: storageImagesForCategories})
const uploadBannersAndPromos = multer ({storage: storageImagesForBannerAndPromo})
const uploadImages = multer({ storage: storageImages });
const uploadBlogs = multer({ storage: storageImagesForBlogs });


module.exports = { deleteImage, uploadImages,uploadBlogs,uploadBannersAndPromos,uploadCategories,uploadCoupons,uploadSubCategories,uploadVariants };

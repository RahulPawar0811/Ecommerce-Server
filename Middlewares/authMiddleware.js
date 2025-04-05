const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET;


// const verifyUser = (req, res, next) => {

//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Access token is missing or invalid." });
//   }

//   const token = authHeader.split(" ")[1];

//   jwt.verify(token, secretKey, (err, decoded) => {
//     if (err) {
//       console.error("Token Verification Error:", err);
//       return res.status(403).json({ message: "Invalid or expired token." });
//     }

//     req.user = {
//       userId: decoded.userId,
//       branchId: decoded.branchId,
//       mobile: decoded.mobile,
//       fname: decoded.firstName,
//       lname: decoded.lastName,
//       email: decoded.email,
//       photo: decoded.photo,
//       orgId: decoded.orgId,
//       role: decoded.role,
//       logo: decoded.logo,
//       isSubCat: decoded.isSubCat,
//       isVariant: decoded.isVariant,
//       variant: decoded.variant,
//       isInventory: decoded.isInventory,
//       isDealer: decoded.isDealer,
//     };

//     console.log("Decoded User Data:", decoded);
//     next();
//   });
// };

const verifyUser = (req, res, next) => {


  const token = req.cookies.AdminToken;
  if (!token) {
    return res.status(401).json({ Error: "You are not authenticated, Provide us access-token key." });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ Error: "Authentication Fail, Invalid Token!!" });
    }

    req.user = decoded;
    next();
  });
};


const getDashboard = (req, res) => {
  return res.json({
    Success: "Success",
    ...req.user,
  });
};

module.exports = { verifyUser,getDashboard };

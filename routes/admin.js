const path = require("path");
const express = require("express");

const addProductValidation = require('../controllers/util');
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth").isAuth;

const router = express.Router();

// /admin/add-product => GET
// it will run the middleware inline from left to right
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post("/add-product",addProductValidation.postProductValidation, isAuth, adminController.postAddProduct);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product", isAuth, addProductValidation.postProductValidation, adminController.postEditProduct);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;

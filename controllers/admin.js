const Product = require("../models/product");
const { validationResult } = require("express-validator/check");
const mongoose = require('mongoose');
const errorHandling = require('../HandlingError/HandlingError');
exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    errors: null,
    allErrors: [],
    product: {
      title: '',
      price: '',
      description: '',
      imageUrl: ''
    }
  });
};

exports.postAddProduct = (req, res, next) => {
  
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const validation = validationResult(req);
  if(!validation.isEmpty()){
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: false,
      errors: validation.array()[0].msg,
      allErrors: validation.array(),
      product: {
        title,
        imageUrl,
        price,
        description,
      }
    });
  }
  const product = new Product({
    _id: new mongoose.Types.ObjectId('613742ecab0d1d3ae04a6c48'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
    // it will throw an error because we had that id and move to catch block because it's promise
  });
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      // we can't pass all res.redirect in all catch, so we use something better, or render the page
      // we can use express error handling, it's built in express and it'll be triggered with next(error)
      // when using next() function, it'll go to other middleware, but with next(error) handling function => it'll trigger
      // handling error middleware with 4 argumnent
      errorHandling(500, next, err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        errors: undefined,
        allErrors: []
      });
    })
    .catch(err => {
      errorHandling(500, next, err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;
  const validation = validationResult(req);
  if(!validation.isEmpty()){
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      errors: validation.array()[0].msg,
      allErrors: validation.array(),
      product: {
        title,
        imageUrl,
        price,
        description,
        _id: prodId
      }
    });
  }
  Product.findById(prodId)
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save();
    })
    .then((result) => {
      console.log("UPDATED PRODUCT!");
      res.redirect("/admin/products");
    })
    .catch((err) => errorHandling(500, next, err));
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((products) => {
      console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => errorHandling(500, next, err));
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findByIdAndRemove(prodId)
    .then(() => {
      console.log("DESTROYED PRODUCT");
      res.redirect("/admin/products");
    })
    .catch((err) => errorHandling(500, next, err));
};

const { body } = require("express-validator/check");
const User = require("../models/user");
exports.findUserValid = (emailUser) => {
  return User.findOne({ email: emailUser });
};

exports.loginValidation = [
  // we can sanitizer our input of user data as well
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email is not valid, please enter correct email")
    .normalizeEmail()
    // turn email to lowercase
    .custom((value, { req }) => {
      return this.findUserValid(value).then((user) => {
        if (!user) {
          return Promise.reject("User is not existed");
        }
      });
    }),
  body("password", "Password must be at least 5 character and numeric")
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
];

exports.postProductValidation = [
  body("title")
    .trim()
    .isString()
    .isLength({ min: 1 })
    .withMessage("Title is not valid"),
  body("imageUrl").isURL().trim().withMessage("Your Image URL is not valid"),
  body("price").isNumeric().trim().withMessage("Price must be a number"),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 4, max: 100 })
    .withMessage("Your description is only allowed has 4 - 100 words!"),
];

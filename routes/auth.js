const express = require("express");
const { check, body } = require("express-validator/check");
const User = require("../models/user");
const authController = require("../controllers/auth");
const authValidation = require("../controllers/util");
const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post("/login", authValidation.loginValidation , authController.postLogin);

// we can custom validate if we want with custom function
// the custom function will take 2 argument, one is value we receive from our route, and one is the where we want to receive it, it'll start
// with object and the option
router.post(
  "/signup",
  [
    // check => we want to check in everywhere, header, body, cookies, ....\
    // we can do asynchoronous task in validation as well, because validator will wait until it's done
    // and it'll return false if it has Promise.reject() => throw error, or return true if it's success
    // and remember, all asynchoronous task have to put inside of custom function
    check("email")
      .isEmail()
      .withMessage("Email is not valid")
      .custom((value, { req }) => {
        // if (value === "test@test.com") {
        //   throw new Error("this email is not valid!");
        // }
        // return true;
        // // if this custom is success, we do that => return true
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject(
              "Email is existed, please choose another email"
            );
            // return false if we have user === throw new Error
          }
        });
        // if we success => automatically return true
      }),
    body(
      "password",
      "Password only accept 5 characters above and number, character"
    )
      .isLength({ min: 6 })
      .isAlphanumeric(),
    body("confirmPassword").custom((value, { req }) => {
      const password = req.body.password;
      if (value !== password) {
        throw new Error("Password needs to match");
      }
      return true;
    }),
    //   we can get the same message if we pass it into second argument of check, function
    //   we only get that field from body
  ],
  authController.postSignup
);

// check will have parameter is an array of field we want to check or one field we want to check
router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getResetPassword);

router.post("/reset/:id", authController.postResetPassword);
module.exports = router;

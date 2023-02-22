const User = require("../models/user");
const crypto = require("crypto");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator/check");
const getUser = require('../controllers/util');
const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);
exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
    errorMessage: req.flash("error"),
    // get back message with req.flash('name'),
    errors: [],
    oldInput: {
      email: '',
      password: ''
    }
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    isAuthenticated: false,
    errorMessage: req.flash("error")[0],
    oldInput: {
      email : '',
      password: '',
      confirmPassword: ''
    },
    errors: []
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Sign in",
      errorMessage: errors.array()[0].msg,
      errors: errors.array(),
      oldInput: {
        email: email,
        password: password
      }
    });
  }
  getUser.findUserValid(email)
    .then((user) => {
      if (!user) {
        // save error message if it's failed
        // to save flash, we call req.flash('string value', 'message')
        // req.flash("error", "Invalid information");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((result) => {
          if (!result) {
            req.flash("error", "password is not valid");
            return res.redirect("/login");
          }
          req.session.user = user;
          req.session.isLoggedIn = true;
          return req.session.save((err) => {
            console.log(err);
            return res.redirect("/");
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // if we have error
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword
      },
      errors: errors.array()
    });
  }
  if (!email || !password || !confirmPassword) {
    req.flash("error", "Information is required!");
    return res.redirect("/signup");
  }
  // we will pass all req to validationResult function to get all error we have

  // if we don't have user, create one
  bcrypt.hash(password, 10, (err, hash) => {
    const newUser = new User({
      email: email,
      password: hash,
      cart: { items: [] },
    });
    newUser
      .save()
      .then((savedUser) => {
        res.redirect("/login");
        return transporter.sendMail({
          from: "hoanganh0594abc@gmail.com",
          to: email,
          html: `<div style='text-align: center'><h1>Sign up succeeded</h1> <p>Thank you for signing up!</p></div>`,
          subject: "Sign up successfully",
          // from: our email
          // to: to email of user in input
          // html: message body
          // subject: title
        });
      })
      .catch((err) => {
        errorHandling(500, next, err)
      });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
    // in logout, we call destroy => remove all token and session we have
  });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    pageTitle: "Reset password",
    path: "/reset",
    errorMessage: req.flash("error"),
  });
};

exports.postReset = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    req.flash("error", "Email is not allowed to be empty!");
    return res.redirect("/reset");
  }
  crypto.randomBytes(32, (err, buffer) => {
    const token = buffer.toString("hex");
    if (err) {
      return res.redirect("/reset");
    }
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", "User is not existed");
          return res.redirect("/reset");
        }
        user.tokenReset = token;
        user.tokenExpiration = Date.now() + 60 * 60 * 1000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        transporter.sendMail({
          from: "hoanganh0594abc@gmail.com",
          to: email,
          subject: "Request for changing password",
          html: `
          <div style="text-align: center">
            <h1>You requested for changing password</h1>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a>
          </div>
        `,
        });
      })
      .catch((err) => {
        errorHandling(500, next, err)
      });
  });
};

exports.getResetPassword = (req, res, next) => {
  const { token } = req.params;
  // $gt: >
  // {$set}
  User.findOne({ tokenReset: token, tokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        req.flash("error", "The process is overtime, you need to try again");
        return res.redirect("/reset");
      }
      res.render("auth/new-password", {
        pageTitle: "New Password",
        id: user._id.toString(),
        path: "new-password",
        errorMessage: req.flash("error"),
        token: token,
      });
    })
    .catch((err) => {
      errorHandling(500, next, err)
    });
};

exports.postResetPassword = (req, res, next) => {
  const { id } = req.params;
  const { token, password } = req.body;
  let getUser;
  User.findOne({
    _id: id,
    tokenReset: token,
    tokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Timeout limited");
        return res.redirect("/reset");
      }
      getUser = user;
      return bcrypt.hash(password, 12);
    })
    .then((newPasswordHash) => {
      getUser.password = newPasswordHash;
      getUser.tokenReset = undefined;
      // remove tokenReset and tokenExpiration
      getUser.tokenExpiration = undefined;
      return getUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      errorHandling(500, next, err)
    });
};

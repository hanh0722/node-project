const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
// to use flash to display message
const flash = require("connect-flash");
// to use token, we import csrf token
const csrf = require("csurf");
const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI =
  "mongodb+srv://admin:admin123@cluster0.bhp9h.mongodb.net/shop?retryWrites=true&w=majority";

const app = express();
const csrfProtection = csrf();
// use package
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "session",
});

const fileEngineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorHandling = require("./HandlingError/HandlingError");

app.use(express.urlencoded({ extended: false }));
app.use(multer({ storage: fileEngineStorage }).single('image'));
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);
// use token csrf

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // and remember outside async code, we can use normal throw Error
  // but inside async code, we have to call next(error)
  // and remember to avoid inifinite loop because when one route is triggered, it'll execute from top to bottom
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      errorHandling(500, next, err);
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use("/500", errorController.get500);
app.use(errorController.get404);

// to use error handling middleware, we use 4 argument with err argument in the bottom of all route, including the not match route
app.use((error, req, res, next) => {
  console.log(error.statusCode);
  res.status(500).render("500", {
    pageTitle: "Error page",
    path: "/500",
  });
});
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });

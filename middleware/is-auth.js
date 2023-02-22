exports.isAuth = (req, res, next) => {
    // in middleware, it'll execute from left to right and we have next() to make sure it'll come to next middleware
    // and other middleware with that
    if(!req.session.isLoggedIn){
        return res.redirect('/login');
    }
    next();
}
module.exports.isLoggedIn = (req, res, next) => {
    //isAuthenticated() is a passport method
    if(!req.isAuthenticated()) {
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

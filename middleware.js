const ExpressError = require('./utils/expressError.js');
const { validationResult } = require('express-validator');

module.exports.requireLogin = (req, res, next) => {
    if (!req.session.loggedin) {
        req.flash('error', '請先登入');
        return res.redirect('/campgrounds/user/login');
    }
    next()
}

module.exports.handleMulterError = function (err) {
    if (err.message === 'File too large') {
        err.message = '圖片檔案過大，上傳限制為5MB'
    }
    return new ExpressError(err.message, 400);
}

module.exports.handleCastError = function (err) {
    console.dir(err);
    return new ExpressError(`無法抓取資料...${err.message}`, 400);
}

module.exports.checkNameAndPwdLength = function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const alert = errors.array();
        return res.status(422).render('user/register.ejs', { alert, title: 'YelpCamp - Register' });
    }
    next();
}
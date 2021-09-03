const express = require('express');
const router = express.Router({ mergeParams: true });
const bcrypt = require('bcrypt');
const { body } = require('express-validator');


const User = require('../models/user.js');
const Campground = require('../models/campground.js');

//圖片上傳的packages
const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary/index.js');
const upload = multer({
    storage,
    limits: {
        //fileSize -> For multipart forms, the max file size (in bytes)
        //1MB = 1000000 bytes,一般網頁普遍接受是2MB
        //但現在是Demo隨便啦XD，上傳的大小限制為5MB
        fileSize: 5000000
    },
    fileFilter: function (req, file, cb) {
        if (!allowedFormats.includes(file.mimetype)) {
            cb(new Error('只支援 .jpeg/.jpg/.png 的圖片'), false);
        } else {
            cb(null, true);
        }
    }
});
//預設大頭貼
const defaultUserImageUrl = 'https://res.cloudinary.com/lunzaizailunzaizai/image/upload/v1630236792/my-side-project-1/user-default.png';
const defaultUserImageFilename = 'my-side-project-1/user-default'

const { requireLogin, checkNameAndPwdLength } = require('../middleware.js');
const ExpressError = require('../utils/expressError.js');

//register form
//original route => /campgrounds/user/register
router.get('/register', (req, res) => {
    if (req.session.loggedin) {
        req.flash('error', '您已經登入了');
        return res.redirect('/campgrounds');
    }
    res.render('user/register.ejs', { title: 'YelpCamp - Register' });
});

//create a new user
//original route => /campgrounds/user, HTTP verb POST
router.post('/',
    upload.single('image'),
    [body('user[username]').trim().isLength({ min: 5 }).withMessage('用戶名稱過短'),
    body('user[password]').trim().isLength({ min: 8 }).withMessage('密碼過短')],
    checkNameAndPwdLength,
    async (req, res, next) => {
        try {
            if (!req.body.user) {
                return next(new ExpressError('註冊資訊不完整', 404));
            }
            const { username, email } = req.body.user;
            const isSameUsername = await User.sameUsernameValidate(username);
            if (isSameUsername) {
                req.flash('error', '該用戶名稱已經存在');
                return res.redirect('/campgrounds/user/register');
            }
            const isSameEmail = await User.sameEmailValidate(email);
            if (isSameEmail) {
                req.flash('error', '該電子郵件已被註冊');
                return res.redirect('/campgrounds/user/register');
            }
            const user = new User(req.body.user);
            //有圖片才會新增到Schema
            //沒照片就不會新增資料到Schema
            //如果沒照片直接用default -> userInfo.ejs(line: 9 - 27)
            if (req.file) {
                const pic = req.file;
                const { path, filename } = pic;
                user.image.url = path;
                user.image.filename = filename;
            }
            await user.save();
            req.session.loggedin = user._id;
            req.flash('success', '創建帳號成功!');
            res.redirect('/campgrounds');
        } catch (err) {
            next(err);
        }
    });

//login form
//original route => /campgrounds/user/login
router.get('/login', (req, res) => {
    if (!req.session.loggedin) {
        res.render('user/login.ejs', { title: 'YelpCamp - Login' });
    } else {
        req.flash('error', '您已經登入了');
        res.redirect('/campgrounds');
    }
});

//login action
//original route => /campgrounds/user/login, HTTP verb POST 
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body.user;
        const foundUser = await User.findOne({ username });
        //check the username does exist or not 
        if (!foundUser) {
            req.flash('error', '用戶名稱或者密碼錯誤');
            res.redirect('/campgrounds/user/login');
        } else {
            const result = await bcrypt.compare(password, foundUser.password);
            if (result) {
                //create a object in session with the user who successfully logged in 
                req.session.loggedin = foundUser._id;
                req.flash('success', '歡迎回來');
                const redirectUrl = req.session.returnTo || '/campgrounds';
                res.redirect(redirectUrl);
            } else {
                req.flash('error', '用戶名稱或者密碼錯誤');
                res.redirect('/campgrounds/user/login');
            }
        }
    } catch (err) {
        next(err);
    }
});

//logout action
//original route => /campgrounds/user/logout
router.get('/logout', requireLogin, (req, res) => {
    req.session.loggedin = false;
    req.flash('success', '登出成功');
    const redirectUrl = req.session.returnTo || '/';
    res.redirect(redirectUrl);
});

//member-client
//original route => /campgrounds/user/:userId
router.get('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        const campgrounds = await Campground.find({ author: userId });
        res.render('user/userInfo.ejs', { defaultUserImageFilename, defaultUserImageUrl, user, campgrounds, title: `YelpCamp - ${user.username}` });
    } catch (err) {
        next(err);
    }
});

//member-client
//original route => /campgrounds/user/:userId, Http Verb POST
//for user changing user-image
router.post('/:userId', requireLogin, upload.single('image'), async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (req.file) {
            const { path, filename } = req.file;
            user.image.url = path;
            user.image.filename = filename;
        } else {
            if (user.image.url && user.image.filename) {
                await cloudinary.uploader.destroy(user.image.filename);
                user.image.url = null
                user.image.filename = null

            } else {
                req.flash('error', '已經沒照片可以刪了');
                return res.redirect(`/campgrounds/user/${userId}`);
            }
        }
        await user.save();
        req.flash('success', '使用者大頭貼已成功更換');
        res.redirect(`/campgrounds/user/${userId}`);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
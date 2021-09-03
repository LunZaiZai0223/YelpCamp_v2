const express = require('express');
const router = express.Router({ mergeParams: true });
//By default, routing跟router之間是不會有關聯的，而parameters of a route
//是被認為是routing的一部分，所以req.params是不會被傳到router的，所以會發生
//在router裡面要用到req.params的資料會回傳undefined的窘境
//{ mergeParams: true } => 可以抓到routing的東西(包含req.params)
//ref: https://github.com/expressjs/express/issues/3084

const User = require('../models/user.js');
const Campground = require('../models/campground.js');
const Review = require('../models/review.js');

const { requireLogin } = require('../middleware.js');

router.post('/', requireLogin, async (req, res, next) => {
    const { id } = req.params;
    const user = req.session.loggedin;
    const foundUser = await User.findById(user);
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = foundUser;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', '發表評論成功');
    res.redirect(`/campgrounds/${id}`);
});

//Original-Routing: /campgrounds/:id/review/:reviewId
router.delete('/:reviewId', requireLogin, async (req, res) => {
    const { id, reviewId } = req.params;
    //找到Campground再藉著reviewId刪除該Campground的review
    await Campground.findByIdAndUpdate(id, { $pull: { review: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', '成功刪除留言');
    res.redirect(`/campgrounds/${id}`);
})

module.exports = router;
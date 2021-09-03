const express = require('express');
const router = express.Router();
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
const ObjectID = require('mongodb').ObjectID;

const Campground = require('../models/campground.js');
const User = require('../models/user.js');
const { requireLogin } = require('../middleware.js');
const ExpressError = require('../utils/expressError.js');

//將資料轉為經緯度
const NodeGeocoder = require('node-geocoder');
const options = {
    provider: 'google',

    // Optional depending on the providers
    apiKey: process.env.My_GOOGLE_MAP_API_KEY, // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};
const geocoder = NodeGeocoder(options);

//如果沒照片，by default的照片url&filename
const defaultCampgroundImgUrl = 'https://res.cloudinary.com/lunzaizailunzaizai/image/upload/v1630217198/my-side-project-1/camp-default.jpg';
const defaultCampgroundFilename = 'my-side-project-1/camp-default';


// index
//實際的路由是('/campgrounds')
router.get('/', async (req, res) => {
    const campgrounds = await Campground.find({}).populate({ path: 'author', select: 'username' });
    //flash會在session中新增一個flash的物件
    //req.flash('key', 'value');
    req.originalUrl = '/campgrounds';
    res.render('campground/index', { campgrounds, title: 'YelpCamp - 全部地點' });
});

//newForm
//實際的路由是('/campgrounds/new')
router.get('/new', requireLogin, (req, res) => {
    res.render('campground/new', { title: 'YelpCamp - 新增地點' });
});

// create
//實際的路由是('/campgrounds') => HTTP Verb POST
//upload.array('image', 3) -> 找表單名稱為image，上傳照片的數量最多三張
router.post('/', upload.array('image', 3), async (req, res, next) => {
    try {
        if (!req.body.campground) { throw new ExpressError('輸入的資料有錯誤', 404); }
        //via session find the matched instance of model user
        const user = await User.findById(req.session.loggedin);
        const newCamp = new Campground(req.body.campground);
        //將表單location的string轉為latitude&longitude
        const locationToLatLng = await geocoder.geocode(req.body.campground.location);
        const latitude = locationToLatLng[0].latitude;
        const longitude = locationToLatLng[0].longitude;
        newCamp.author = user;
        newCamp.latitude = latitude;
        newCamp.longitude = longitude;
        //如果有新增圖片，就將圖片推到到Schema
        if (req.files.length > 0) {
            //input -> multiple, req.files會回傳array
            //Array.map()可以根據條件從原本的arr建立一個符合條件的arr
            //如果要建立一個[{}]arr,在map的func中({})
            const pic = req.files.map(x => ({ url: x.path, filename: x.filename }));
            newCamp.image = pic;
            //如果沒有就把圖片的url&filename寫死
        } else {
            const pic = [{
                url: defaultCampgroundImgUrl,
                filename: defaultCampgroundFilename
            }];
            newCamp.image = pic;
        }
        await newCamp.save();
        req.flash('success', '成功新增');
        res.redirect(`/campgrounds/${newCamp._id}`);

    } catch (err) {
        next(err);
    }
});

//editform
//實際的路由是('/campgrounds/:id/edit')
router.get('/:id/edit', requireLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const campground = await Campground.findById(id);
        res.render('campground/edit', { campground, title: 'YelpCamp - 修改地點' });
    } catch (err) {
        next(err);
    }
});

//update
//實際的路由是('/campgrounds/:id') => HTTP Verb PATCH
router.patch('/:id', upload.array('image', 3), async (req, res, next) => {
    try {
        if (!req.body.campground) { throw new ExpressError('輸入的資料有錯誤', 404); }
        const { id } = req.params;
        const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { new: true });
        const locationToLatLng = await geocoder.geocode(req.body.campground.location);
        const latitude = locationToLatLng[0].latitude;
        const longitude = locationToLatLng[0].longitude;
        campground.latitude = latitude;
        campground.longitude = longitude;
        await campground.save();
        //req.files一定會有，所以可以設定如果length>0
        //如有新增圖片的話
        if (req.files.length > 0) {
            const pic = req.files.map(x => ({ url: x.path, filename: x.filename }));
            //[{url: f.url, f.filename}]
            //...spread operator => 解開array的[]
            campground.image.push(...pic);
            await campground.save();
        }
        //如果沒勾選就不會有req.body.deletedImages，只能用是否「存在」
        //如有勾選刪除圖片的話
        if (req.body.deletedImages) {
            for (let deletedImageFilename of req.body.deletedImages) {
                //如果圖片名稱不是default才刪
                if (deletedImageFilename != defaultCampgroundFilename) {
                    await cloudinary.uploader.destroy(deletedImageFilename);
                }
            }
            //update不用儲存save
            await campground.updateOne({ $pull: { image: { filename: { $in: req.body.deletedImages } } } });
        }
        req.flash('success', '修改完成');
        res.redirect(`/campgrounds/${id}`);
    } catch (err) {
        next(err);
    }
});

//like
//實際的路由是('/campgrounds/:id/like')
router.post('/:id/like', requireLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const campground = await Campground.findById(id);
        const user = await User.findById(req.session.loggedin);
        campground.likers.push(user);
        await campground.save();
        res.redirect(`/campgrounds/${id}`)
    } catch (err) {
        next(err);
    }
});

//nolike
//實際的路由是('/campgrounds/:id/nolike')
router.post('/:id/nolike', requireLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const campground = await Campground.findById(id);
        const user = await User.findById(req.session.loggedin);
        //likers:[612b84026f36449953cf761f,612b84026f36449953cf761f]
        //$pull會刪掉陣列中符合codition的資料
        await campground.updateOne({ $pull: { likers: { $in: user._id } } });
        res.redirect(`/campgrounds/${id}`);
    } catch (err) {
        next(err);
    }
});

//delete
//實際的路由是('/campgrounds/:id') => HTTP Verb delete
router.delete('/:id', requireLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        // findByIdAndDelete可以觸發query middleware findOneAndDelete
        // 用post=>刪除這個Camp後再刪除其review
        const deletedCampground = await Campground.findByIdAndDelete(id);
        for (let deletedCampgroundsImage of deletedCampground.image) {
            //如果filename是default-image就不刪除其Cloudinary的檔案
            //因為default圖片只有一張
            if (deletedCampgroundsImage.filename !== defaultCampgroundFilename) {
                await cloudinary.uploader.destroy(deletedCampgroundsImage.filename);
            }
        }
        req.flash('success', '已經成功刪除');
        res.redirect('/campgrounds');
    } catch (err) {
        next(err);
    }
});

//show
//實際的路由是('/campgrounds/:id')
router.get('/:id', async (req, res, next) => {
    try {
        if (!ObjectID.isValid(req.params.id)) {
            req.session.returnTo = req.session.previousReturnTo;
            console.log('無效的campground show id, req.session.returnTo變為:', req.session.returnTo);
        }
        const { id } = req.params;
        console.log(`此時的req.params.id是${id}`);
        const campground = await Campground.findOne({ _id: id })
            //選擇field reviews 取得author但又要保存reviews其他field的資料
            // 會變成campground.reviews & campground.reviews.author
            //再回頭populate campground的field author
            .populate({ path: 'reviews', populate: 'author' }).populate({ path: 'likers', populate: 'author' }).populate('author');
        //.populate({path:'reviews', select:'author'}).populate('author');
        //會變成campground.reviews.author =>只會有author的資料而已

        //likers可能會有很多，所以在定義Schema的時候已經設為array
        //製造一個只有userId的array給show.ejs判斷要怎麼顯示按鈕(line: 54-66)
        const likersId = campground.likers.map(x => x._id);
        res.render('campground/show', { campground, likersId, title: `YelpCamp - ${campground.title}` });
    } catch (err) {
        next(err);
    }
});


//最後記得要exports!
module.exports = router;
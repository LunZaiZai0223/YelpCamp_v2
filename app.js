if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const engine = require('ejs-mate');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const path = require('path');
const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");

//routes
const campgroundRoutes = require('./routes/campground.js');
const userRoutes = require('./routes/user.js');
const reviewRoutes = require('./routes/review.js');

//middleware
const { handleMulterError, handleCastError } = require('./middleware.js');

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/sideProject1';

mongoose.connect(dbUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        userCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    });

app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));
// can get POST form data 
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

//helmet接受的來源，有用到什麼記得補上
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://maps.googleapis.com/",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    "https://ka-f.fontawesome.com/",
];
const fontSrcUrls = [
    "https://ka-f.fontawesome.com/",
    "https://fonts.gstatic.com/",
];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/lunzaizailunzaizai/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://maps.googleapis.com/",
                "https://maps.gstatic.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const secret = process.env.SECRET || 'thisisatestingsecret';

const store = MongoDBStore.create({
    mongoUrl: dbUrl, 
    touchAfter: 24 * 60 * 60,
    secret 
});

const sessionConfig = {
    store,
    resave: false,
    secret,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e);
});


app.use(session(sessionConfig));
app.use(flash());


app.use((req, res, next) => {
    res.locals.userIsLoggedIn = false;
    //登入後會把local-variable userIsLoggedIn的值改為當前登入者的_id
    if (req.session.loggedin) {
        res.locals.userIsLoggedIn = req.session.loggedin;
    }
    console.log(`目前的登入狀態: ${res.locals.userIsLoggedIn}`);
    if (!['/campgrounds/user/login', '/campgrounds/user/logout'].includes(req.originalUrl)) {
        req.session.previousReturnTo = req.session.returnTo;
        req.session.returnTo = req.originalUrl;
    }
    console.log(`上一個redirectUrl為: ${req.session.previousReturnTo}`);
    console.log(`目前redirectUrl為: ${req.session.returnTo}`);
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    // delete res.locals.successMessage;
    // delete req.session.flash;
    next();
})

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/user', userRoutes);
app.use('/campgrounds/:id/review', reviewRoutes);

app.get('/', (req, res) => {
    res.render('campground/homepage.ejs');
});

const ExpressError = require('./utils/expressError.js');
app.all('*', (req, res, next) => {
    req.session.returnTo = req.session.previousReturnTo;
    next(new ExpressError('Page Not Found', 404));
});

//得知error的name
//判別後丟到下面的Error-handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'CastError') { err = handleCastError(err); }
    if (err.name === 'MulterError') { err = handleMulterError(err); }
    console.log(`Error的名稱是: ${err.name}`);
    next(err);
});

//Error-handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500, message = '發生無法預期的錯誤' } = err;
    res.status(statusCode).render('alert/alert.ejs', { err, title: `${err.name}` });
    //就跟一般的route一樣，可以send，也可以render(丟ejs檔案!!)
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on ${port}`);
});

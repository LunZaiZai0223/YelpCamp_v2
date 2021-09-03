if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');

//Models
const User = require('../models/user.js');
const Campground = require('../models/campground.js');
const Review = require('../models/review.js');
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

//Username
// -> Array
//Password
// -> Array + num
//Email
// -> Array@gmail.com

const fakeUsernamesArray = [
    'tsaiingwen',
    'danielhan',
    'sootsingtshiong',
    'chengjisihan',
    'admin'
];

const fakeUsernameImages = [
    {
        url: 'https://res.cloudinary.com/lunzaizailunzaizai/image/upload/v1630479357/my-side-project-1/tsaiingwen-default.png',
        filename: 'my-side-project-1/tsaiingwen-default'
    },
    {
        url: 'https://res.cloudinary.com/lunzaizailunzaizai/image/upload/v1630242280/my-side-project-1/danielhan-default.jpg',
        filename: 'my-side-project-1/danielhan-default'
    },
    {
        url: 'https://res.cloudinary.com/lunzaizailunzaizai/image/upload/v1630636222/my-side-project-1/sootsingtshiong-default.jpg',
        filename: 'my-side-project-1/sootsingtshiong-default'
    },
    {
        url: 'https://res.cloudinary.com/lunzaizailunzaizai/image/upload/v1630286725/my-side-project-1/chengjisihan-default.jpg',
        filename: 'my-side-project-1/chengjisihan-default'
    }
];

async function createFakeUsers() {
    //刪除全部的資料
    await User.deleteMany({});
    await Campground.deleteMany({});
    await Review.deleteMany({});

    for (let i = 0; i < fakeUsernamesArray.length; i++) {
        const username = fakeUsernamesArray[i];
        const password = `${fakeUsernamesArray[i]}${i}`;
        const email = `${fakeUsernamesArray[i]}@gmail.com`;
        const image = fakeUsernameImages[i];

        const user = new User({
            username,
            password,
            email,
            image
        });
        await user.save();
    }

}

//斷開連結
createFakeUsers()
    .then(() => {
        mongoose.connection.close();
    });
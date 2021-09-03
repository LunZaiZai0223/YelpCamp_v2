const mongoose = require('mongoose');
const Campground = require('../../models/campground.js');
const cities = require('./cleanedCities.js');
const districts = require('./cleanedDistricts.js');
const { descriptors, places } = require('./seedsHelper.js');

mongoose.connect('mongodb://localhost:27017/sideProject1',
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

const titleSample = arr => arr[Math.floor(Math.random() * arr.length)];


const createSeedsData = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random21 = Math.floor(Math.random() * 21);
        const city = cities[random21];
        const { district } = districts[random21];
        const indexNum = Math.floor(Math.random() * district.length);
        const singleDistrict = district[indexNum];
        const price = Math.floor(Math.random() * 500) + 1;
        const description = "空調按鈕總部一次什麼尤其是，廣大並且數碼權力有意中壢歐美本書團隊由此完善我是，生存閲讀者是因為本類訂單行為身材臺中所屬光臨順利。"

        const campground = new Campground({
            title: `${titleSample(descriptors)} ${titleSample(places)}`,
            location: `${city}${singleDistrict}`,
            price,
            description,
            author: '6125b6076c6e216c7d671d54',
            image: [
                {
                    url: 'https://res.cloudinary.com/lunzaizailunzaizai/image/upload/v1630051155/my-side-project-1/wc30xa9qbdnm45tm9xrp.jpg',
                    filename: 'my-side-project-1/wc30xa9qbdnm45tm9xrp'
                }
            ]
        });
        await campground.save();
    }
}

createSeedsData()
    .then(() => {
        mongoose.connection.close();
    });




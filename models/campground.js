const mongoose = require('mongoose');

const Review = require('./review.js');

const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnailForShow').get(function () {
    return this.url.replace('/upload', '/upload/w_544,h_363,c_scale');
});

ImageSchema.virtual('thumbnailForEditForm').get(function () {
    return this.url.replace('/upload', '/upload/w_200,h_150,c_scale');
});

const CampgroundSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: [
        ImageSchema
    ],
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    likers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
});

CampgroundSchema.post('findOneAndDelete', async function (deletedCampground) {
    if (deletedCampground) {
        const relatedReviews = deletedCampground.reviews;
        await Review.deleteMany({ _id: { $in: relatedReviews } });
    }
});

module.exports = mongoose.model('Campground', CampgroundSchema);
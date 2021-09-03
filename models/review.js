const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    review: {
        type: String,
        required: true
    },
    point: {
        type: Number,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}
    , { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Review', ReviewSchema);
const mongoose = require('mongoose');
// const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        url: String,
        filename: String
    }
});

//will add fields username(aleady checked same or not) and passport(already hash) on to UserSchema
// UserSchema.plugin(passportLocalMongoose);

UserSchema.statics.sameUsernameValidate = async function (username) {
    const isSameUsername = await this.findOne({ username });
    return isSameUsername ? true : false;
}

UserSchema.statics.sameEmailValidate = async function (email) {
    const isSameEmail = await this.findOne({ email });
    return isSameEmail ? true : false;
}


//this -> model instance
//before saving a new user, hash the password
UserSchema.pre('save', async function (next) {
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model('User', UserSchema);

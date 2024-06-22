const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
//Only email is in the User Schema, because the passport NPM packages are going to add usernames.
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);

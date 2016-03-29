var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

// // this is an example pulled from the sequelize website for creating a new model
// var User = sequelize.define('user', {
//   firstName: {
//     type: Sequelize.STRING,
//     field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
//   },
//   lastName: {
//     type: Sequelize.STRING
//     field: 'last_name'
//   }
//   //password needs to be hashed like it was in mongo, can this be done with bcrypt?
//   password: {
//     type: Sequelize.STRING
//   }
//   email: {
//     type: Sequelize.STRING
//   }
// }, {
//   freezeTableName: true // Model tableName will be the same as the model name
// });
//
// User.sync({force: true}).then(function () {
//   // Table created
//   return User.create({
//     firstName: 'John',
//     lastName: 'Hancock',
//     password: '123',
//     email: 'john@john.com'
//   });
// });

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var stringField = {
    type: String,
    minlength: 1,
    maxlength: 50
}

var UserSchema = new Schema({
    email: {
        type: String,
        minlength: 1,
        maxlength: 50,
        lowercase: true,
        unique: true
    },
    name: stringField,
    hashed_password: stringField
});

UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('hashed_password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.hashed_password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.hashed_password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.hashed_password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.statics.count = function (cb) {
  return this.model('Users').find({}, cb);
}

module.exports = mongoose.model('Users', UserSchema);

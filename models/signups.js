var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var SignupSchema = new Schema({
    email: {type: String},
    name: {type: String},
    comment: {type: String},
});

module.exports = mongoose.model('Signups', SignupSchema);

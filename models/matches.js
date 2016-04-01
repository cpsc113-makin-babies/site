var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var MatchSchema = new Schema({
    user1: {type: Schema.Types.ObjectId, ref: 'Users'},
    user2: {type: Schema.Types.ObjectId, ref: 'Users'}
});

module.exports = mongoose.model('Matches', MatchSchema);

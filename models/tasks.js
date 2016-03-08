var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var stringField = {
    type: String,
    minlength: 1,
    maxlength: 500
}

var taskSchema = new Schema({
    owner: ObjectId,
    title: stringField,
    description: stringField,
    isComplete: Boolean,
    collaborators: [String]
});

module.exports = mongoose.model('Tasks', taskSchema);
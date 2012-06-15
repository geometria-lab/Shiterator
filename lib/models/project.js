var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var TrackerLink = new Schema({
    tracker : { type: String, required: true, enum: ['pivotal', 'airbrake'] },
    options : { type: {} }
});

TrackerLink.methods.getHash = function() {
    return JSON.stringify(this.toJSON());
};

var Project = new Schema({
    title        : { type: String, required: true },
    secret       : { type: String, required: true, index: true },
    trackerLinks : [ TrackerLink ]
});

module.exports = mongoose.model('Project', Project);
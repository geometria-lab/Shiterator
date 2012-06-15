var pivotal = require('pivotal'),
    util = require('util'),
    utils = require('./../../../old/utils.js');

var Pivotal = function(options) {
    this._options = utils.merge({
        token           : '',
        label           : 'shiterator',
        phpLabel        : 'php',
        javaScriptLabel : 'javascript'
    }, options);

    pivotal.useToken(this._options.token);
}

Pivotal.prototype.post = function(error, count) {
    count = count || 1;

    var errorLabel = this._getLabel(error),
        filters    = { limit : 1, filter : 'label:"shiterator" label:"' + errorLabel + '" "' +  error.subject + '"' };

    pivotal.getStories(error.tracker.project, filters, function(err, response) {
        if (err) {
            util.log("Error get pivotal story with filter: " + util.inspect(filters) + ". Message: " + util.inspect(err));
        } else if (response.story && response.story.current_state != 'delivered' && response.story.current_state != 'accepted') {
            this._update(response.story, error, count);
        } else {
            this._create(error, count);
        }
    }.bind(this));
};

Pivotal.prototype._create = function(error, count) {
    var data = {
        name           : "(" + count + ") " + error.subject,
        story_type     : 'bug',
        description    : this._getDescription(error),
        labels         : this._options.label + ',' + this._getLabel(error)
    };

    if (error.tracker.label) {
        data.labels += ',' + error.tracker.label;
    }

    pivotal.addStory(error.tracker.project, data, function(err, response) {
        if (err) {
            util.log("Error create pivotal story: " + error.subject + '. Description size: ' + data.description.length);
        }
    });
}

Pivotal.prototype._update = function(story, error, count) {
    var beforeCount = parseInt(story.name.substring(1, story.name.indexOf(')')));

    var data = {
        name : "(" + (count + beforeCount) + ") " + error.subject
    };

    pivotal.updateStory(error.tracker.project, parseInt(story.id), data, function(err, response){
        if (err) {
            util.log("Error update pivotal story: " + error.subject);
        }
    });
}

Pivotal.prototype._getLabel = function(error) {
    return this._options[ error instanceof JavaScript ? 'javaScriptLabel' : 'phpLabel'];
}

Pivotal.prototype._getDescription = function(error) {
    var description = "    " + error.message +
           "\n\n\n\n" +
           "##Stack\n\n";

    var stack = error.stack.split("\n");
    for (var i = 0, l = stack.length; i < l; i++) { //> 20 ? 20 : stack.length
        description += "    " + stack[i] + "\n";
    }

    description += "\n\n##Info\n\n";

    var info = utils.clone(error.custom);
    info.time = error.time;

    for (var field in info) {
        description += "* **" + field + "**: " + info[field] + "\n";
    }

    return description;
}

Pivotal.prototype.isValidError = function(error) {
    for (var i = 0; i < Pivotal.REQUIRED_FIELDS.length; i++) {
        if (!error.tracker[Pivotal.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }

    return true;
};

Pivotal.REQUIRED_FIELDS = [ 'project' ];

module.exports = Pivotal;
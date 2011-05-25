var JavaScriptError = require('./errors/javascript.js'),
    PHPError        = require('./errors/php_error.js'),
    PHPException    = require('./errors/php_exception.js');

module.exports = Errors = function() {
    this._errors = {};
}

Errors.prototype.add = function(error) {
    if (!this._errors[error.subject]) {
        this._errors[error.subject] = [];
    }
    this._errors[error.subject] = error;

    return this;
}

Errors.prototype.post = function(bugtrack) {
    for (var subject in this._errors) {
        var error = this._errors[subject];

        var ticket = bugtrack.get(error);

        if (ticket) {
            ticket.update(error);
        } else {
            bugtrack.post(error);
        }
    }

    return this;
}

Errors.prototype.clear = function() {
    this._errors = {};

    return this;
}

Errors.REQUIRED_FIELDS = [ 'type', 'subject', 'message', 'line', 'file' ];

Errors.TYPES = {
    'javaScript'   : JavaScriptError,
    'phpError'     : PHPError,
    'phpException' : PHPException
};

Errors.create = function(rawError) {
    try {
        var jsonError = JSON.parse(rawError);
    } catch (e) {
        return false;
    }

    for (var i = 0; i < Errors.REQUIRED_FIELDS; i++) {
        if (!jsonError[Errors.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }

    var errorClass = Errors.TYPES[jsonError.type];
    if (!errorClass) {
        return false;
    }

    return new errorClass(jsonError);
}
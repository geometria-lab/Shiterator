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

Errors.TYPES = {
    'javaScript'   : JavaScriptError,
    'phpError'     : PHPError,
    'phpException' : PHPException
};
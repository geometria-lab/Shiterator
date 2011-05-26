module.exports = Error = function(json) {
    this._setFields(Error, json);
}

Error.prototype._setFields = function(error, json) {
    for (var i = 0; i < error.REQUIRED_FIELDS; i++) {
        this[error.REQUIRED_FIELDS[i]] = json[error.REQUIRED_FIELDS[i]];
    }

    this.time = Date.now();
}

Error.TYPES = {
    javaScript   : require('./errors/javascript.js'),
    phpError     : require('./errors/php_error.js'),
    phpException : require('./errors/php_exception.js')
};

Error.REQUIRED_FIELDS = [ 'subject', 'message', 'line', 'file', 'stack', 'url', 'referer', 'userAgent', 'custom' ];

Error.create = function(raw) {
    try {
        var json = JSON.parse(raw);
    } catch (e) {
        return false;
    }

    var error;
    if (json.type == undefined || !(error = Error.TYPES[json.type])) {
        return false;
    }

    for (var i = 0; i < error.REQUIRED_FIELDS; i++) {
        if (!json[error.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }

    return new error(json);
}
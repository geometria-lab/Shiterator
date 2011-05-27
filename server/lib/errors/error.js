module.exports = ShiteratorError = function(json) {
    this._setFields(ShiteratorError, json);
}

ShiteratorError.prototype._setFields = function(json) {
    for (var i = 0; i < ShiteratorError.REQUIRED_FIELDS.length; i++) {
        this[ShiteratorError.REQUIRED_FIELDS[i]] = json[ShiteratorError.REQUIRED_FIELDS[i]];
    }

    this.time = new Date();
}

ShiteratorError.TYPES = {
    javaScript   : require('./javascript.js'),
    phpError     : require('./php_error.js'),
    phpException : require('./php_exception.js')
};

ShiteratorError.REQUIRED_FIELDS = [ 'subject', 'message', 'line', 'file', 'stack', 'tracker', 'custom' ];

ShiteratorError.create = function(json) {
    var error;
    if (json.type == undefined || !(error = ShiteratorError.TYPES[json.type])) {
        return false;
    }

    for (var i = 0; i < ShiteratorError.REQUIRED_FIELDS.length; i++) {
        if (!json[ShiteratorError.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }

    return new error(json);
}
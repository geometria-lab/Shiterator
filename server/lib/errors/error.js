module.exports = ShiteratorError = function(json) {
    this._setFields(ShiteratorError, json);
}

ShiteratorError.prototype._setFields = function(json) {
    for (var name in ShiteratorError.REQUIRED_FIELDS) {
        this[name] = json[name];
    }

    this.time = new Date();
}

ShiteratorError.TYPES = {
    javascript   : require('./javascript.js'),
    phpError     : require('./php_error.js'),
    phpException : require('./php_exception.js')
};

ShiteratorError.REQUIRED_FIELDS = { 'type' : true, 'subject' : true, 'message' : false, 'line' : true, 'file' : true, 'stack' : false, 'tracker' : true, 'custom' : false };

ShiteratorError.create = function(json) {
    for (var name in ShiteratorError.REQUIRED_FIELDS) {
        if (json[name] === undefined || (ShiteratorError.REQUIRED_FIELDS[name] && json[name] === '')) {
            return false;
        }
    }

	var error = ShiteratorError.TYPES[json.type];

	return error ? new error(json) : false;
}
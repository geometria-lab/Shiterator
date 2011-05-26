var util = require('util');
var Error = require('./error.js');

module.exports = PHPError = function(json) {
    this._setFields(PHPError, json);
}

util.inherits(PHPError, Error);

PHPException.REQUIRED_FIELDS = ['server', 'httpMethod', 'clientIp', 'serverIp', 'sAPI'].concat(Error.REQUIRED_FIELDS);
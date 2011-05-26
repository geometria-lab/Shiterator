var util = require('util');
var Error    = require('./error.js'),
    PHPError = require('./php_error.js');

module.exports = PHPException = function(json) {
    this._setFields(PHPError, json);
}

util.inherits(PHPException, Error);
var util = require('util');
var ShiteratorError = require('./error.js');

module.exports = PHPError = function(json) {
    this._setFields(json);
}

util.inherits(PHPError, ShiteratorError);
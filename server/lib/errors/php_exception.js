var util = require('util');

var ShiteratorError = require('./error.js');

module.exports = PHPException = function(json) {
    this._setFields(json);
}

util.inherits(PHPException, ShiteratorError);
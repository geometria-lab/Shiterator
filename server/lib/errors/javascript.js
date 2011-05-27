var util = require('util');
var ShiteratorError = require('./error.js');

module.exports = JavaScript = function(json) {
    this._setFields(json);
}

util.inherits(JavaScript, ShiteratorError);
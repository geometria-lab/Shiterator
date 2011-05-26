var util = require('util');
var Error = require('./error.js');

module.exports = JavaScript = function(json) {
    this._setFields(Error, json);
}

util.inherits(JavaScript, Error);
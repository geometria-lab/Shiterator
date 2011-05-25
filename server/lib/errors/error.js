var Errors = require('./../errors.js');

module.exports = Error = function(json) {
    for (var i = 0; i < Errors.REQUIRED_FIELDS; i++) {
        this[Errors.REQUIRED_FIELDS[i]] = json[Errors.REQUIRED_FIELDS[i]];
    }
}
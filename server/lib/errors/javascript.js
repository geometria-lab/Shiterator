module.exports = JavaScriptError = function(json) {
    for (var i = 0; i < Errors.REQUIRED_FIELDS; i++) {
        this[Errors.REQUIRED_FIELDS[i]] = json[Errors.REQUIRED_FIELDS[i]];
    }
}
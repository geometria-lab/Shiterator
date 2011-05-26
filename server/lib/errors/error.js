module.exports = Error = function(json) {
    for (var i = 0; i < Errors.REQUIRED_FIELDS; i++) {
        this[Error.REQUIRED_FIELDS[i]] = json[Error.REQUIRED_FIELDS[i]];
    }

}

Error.REQUIRED_FIELDS = [ 'type', 'subject', 'message', 'line', 'file', 'url', 'time', 'referer' ];

Error.create = function(raw) {
    try {
        var json = JSON.parse(raw);
    } catch (e) {
        return false;
    }

    for (var i = 0; i < Error.REQUIRED_FIELDS; i++) {
        if (!json[Error.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }

    var errorClass = Errors.TYPES[json.type];
    if (!errorClass) {
        return false;
    }

    return new errorClass(json);
}
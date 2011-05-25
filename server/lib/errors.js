module.exports = Errors = function() {
    this._errors = {};
}

Errors.prototype.add = function(rawError) {


    var hash = error.subject;

    if (!this._errors[hash]) {
        this._errors[hash] = [];
    }
    this._errors[hash] = error;
}

Errors.prototype.post = function(bugtrack) {

}

Errors.prototype.clear = function() {

}

Errors.REQUIRED_FIELDS = [ 'type', 'subject', 'message', 'line', 'file' ];

Errors.create = function(rawError) {
    try {
        var jsonError = JSON.parse(rawError);
    } catch (e) {
        return false;
    }

    for (var i = 0; i < Errors.REQUIRED_FIELDS; i++) {
        if (!jsonError[Errors.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }


}
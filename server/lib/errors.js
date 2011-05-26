module.exports = Errors = function() {
    this._errors = {};
}

Errors.prototype.add = function(error) {
    if (!this._errors[error.subject]) {
        this._errors[error.subject] = [];
    }
    this._errors[error.subject] = error;

    return this;
}

Errors.prototype.post = function(bugtrack) {
    for (var subject in this._errors) {
        var error = this._errors[subject];

        var issue = bugtrack.get(error);

        if (issue) {
            issue.update(error);
        } else {
            bugtrack.post(error);
        }
    }

    return this;
}

Errors.prototype.clear = function() {
    this._errors = {};

    return this;
}